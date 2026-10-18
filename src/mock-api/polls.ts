import 'server-only'
import type { PoolClient } from 'pg'
import type {
    Audience, Element, ElementOption, PollDetail, PollDraft, PollSettings, PollStatus, PollSummary, ResultDisplay, Review,
} from '@/api/types'
import { isChoice, isQuestion } from '@/api/types'
import type { UserRow } from './auth'
import { db } from './db'
import { problem } from './http'
import { isOurImageUrl } from './images'

export type PollRow = {
    id: string
    owner_id: string
    status: PollStatus
    version: number
    title: string
    description: string
    cover_image_url: string | null
    closes_at: Date | null
    submitted_at: Date | null
    opened_at: Date | null
    closed_at: Date | null
    closed_early: boolean
    close_reason: string | null
    audience: Audience
    settings: PollSettings
    result_display: ResultDisplay | null
    taken_down: boolean
    takedown_reason: string | null
    closed_by: string | null
    created_at: Date
}

export const DEFAULT_SETTINGS: PollSettings = {
    showResultsRealtime: false, allowAnswerEdit: true, listedPublicly: true, allowRepeat: false, identifySender: false,
}

// ค่าตั้งที่มีผลจริง: โพลสาธารณะลงคะแนนซ้ำได้เสมอและระบุคนส่งไม่ได้ · ลงคะแนนซ้ำแล้วไม่มีความหมายของ "แก้คำตอบ"
export function settingsOf(poll: Pick<PollRow, 'settings' | 'audience'>): PollSettings {
    const s = { ...DEFAULT_SETTINGS, ...poll.settings }
    if (poll.audience.type === 'public') return { ...s, allowRepeat: true, identifySender: false, allowAnswerEdit: false }
    return s.allowRepeat ? { ...s, allowAnswerEdit: false } : s
}
export const DEFAULT_DISPLAY: ResultDisplay = {
    published: true, elementIds: null, views: ['list'], showCount: true, showPercent: true, showTotal: true,
}

const iso = (d: Date | null) => (d ? d.toISOString() : null)

// แทนงาน close-poll ที่ตั้งเวลาไว้ของ backend จริง: โพลที่เลยเวลาปิดตัดเป็น closed ตอนมีคนเรียก API
export async function sweepExpired() {
    await db.query(
        `UPDATE polls SET status = 'closed', closed_at = closes_at, updated_at = now()
         WHERE status = 'open' AND closes_at <= now()`,
    )
}

export async function loadPoll(id: string, client: PoolClient | typeof db = db, lock = false): Promise<PollRow | null> {
    // id ที่ไม่ใช่ uuid ให้ถือว่าไม่พบ (ไม่ปล่อยให้ Postgres โยน error)
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null
    const { rows } = await client.query<PollRow>(
        `SELECT * FROM polls WHERE id = $1 AND deleted_at IS NULL${lock ? ' FOR UPDATE' : ''}`,
        [id],
    )
    return rows[0] ?? null
}

// ผู้ใช้อยู่ในกลุ่มผู้ตอบไหม: public = ใครที่ล็อกอินก็ได้ (รวม Google) · chula = ยืนยันผ่าน CUNEX
// restricted = ตรงกฎคณะ (+สาขา [เสนอเพิ่ม]) + ปีเข้า · codes [เสนอเพิ่ม] = รหัสอยู่ในรายชื่อ
export function isEligible(user: UserRow, audience: Audience) {
    if (audience.type === 'public') return true
    if (!user.is_chula_verified) return false
    if (audience.type === 'chula') return true
    if (audience.type === 'codes') return !!user.student_id && audience.codes.includes(user.student_id)
    return audience.rules.some((r) =>
        r.facultyCode === user.faculty_code
        && (!r.departmentCode || r.departmentCode === user.department_code)
        && (r.studentYear === null || r.studentYear === user.student_year))
}

export const isStaff = (user: UserRow, poll: PollRow) => user.role === 'admin' || poll.owner_id === user.id

// โพลที่ผู้เรียกไม่มีสิทธิ์เห็นตอบ 404 (ไม่ใช่ 403) เดา id โพลไม่ได้
export async function visiblePoll(id: string, user: UserRow): Promise<PollRow> {
    await sweepExpired()
    const poll = await loadPoll(id)
    if (!poll) throw problem(404, 'POLL_NOT_FOUND', 'ไม่พบโพล')
    if (isStaff(user, poll)) return poll
    if ((poll.status === 'open' || poll.status === 'closed') && isEligible(user, poll.audience)) return poll
    throw problem(404, 'POLL_NOT_FOUND', 'ไม่พบโพล')
}

export async function ownedPoll(id: string, user: UserRow, client: PoolClient | typeof db = db): Promise<PollRow> {
    await sweepExpired()
    const poll = await loadPoll(id, client, client !== db)
    if (!poll || poll.owner_id !== user.id) throw problem(404, 'POLL_NOT_FOUND', 'ไม่พบโพล')
    return poll
}

export function requireStatus(poll: PollRow, allowed: PollStatus[], title: string) {
    if (!allowed.includes(poll.status)) throw problem(409, 'POLL_LOCKED', title, { pollStatus: poll.status })
}

// ── elements ──

type ElementRow = { id: string; position: number; type: Element['type']; title: string | null; is_required: boolean; config: Record<string, unknown> }
type OptionRow = { id: string; element_id: string; label: string; description: string | null; image_url: string | null; image_alt: string | null; popup: ElementOption['popup'] }

export async function loadElements(pollId: string): Promise<Element[]> {
    const [{ rows: elements }, { rows: options }] = await Promise.all([
        db.query<ElementRow>('SELECT id, position, type, title, is_required, config FROM elements WHERE poll_id = $1 ORDER BY position', [pollId]),
        db.query<OptionRow>(
            `SELECT o.* FROM options o JOIN elements e ON e.id = o.element_id WHERE e.poll_id = $1 ORDER BY o.position`,
            [pollId],
        ),
    ])
    return elements.map((e) => {
        const base = { id: e.id, type: e.type, title: e.title, isRequired: e.is_required, config: e.config }
        if (!['single_choice', 'multi_choice', 'dropdown'].includes(e.type)) return base as Element
        return {
            ...base,
            options: options.filter((o) => o.element_id === e.id).map((o) => ({
                id: o.id, label: o.label, description: o.description, imageUrl: o.image_url, imageAlt: o.image_alt, popup: o.popup,
            })),
        } as Element
    })
}

// ── serialize ──

export function resultDisplayOf(poll: PollRow): ResultDisplay {
    return { ...DEFAULT_DISPLAY, ...(poll.result_display ?? {}) }
}

// ผู้ตอบเห็นผลเมื่อเจ้าของเผยแพร่ และ (ปิดโหวตแล้ว หรือ เปิดผลเรียลไทม์และตัวเองตอบแล้ว) · เจ้าของ/แอดมินเห็นเสมอ
export function canViewResults(user: UserRow, poll: PollRow, submitted: boolean) {
    if (isStaff(user, poll)) return true
    if (!resultDisplayOf(poll).published) return false
    return poll.status === 'closed' || (poll.status === 'open' && poll.settings.showResultsRealtime && submitted)
}

export const isAcceptingVotes = (poll: PollRow) => poll.status === 'open' && !!poll.closes_at && poll.closes_at > new Date()

// [เสนอเพิ่ม] ระบุคนส่งมีผลจริงเฉพาะโพลที่ไม่ใช่สาธารณะ
export const identifiesSender = (poll: Pick<PollRow, 'settings' | 'audience'>) => settingsOf(poll).identifySender

export async function ballotState(pollId: string, userId: string) {
    const { rowCount } = await db.query('SELECT 1 FROM ballots WHERE poll_id = $1 AND voter_key = $2 LIMIT 1', [pollId, userId])
    return (rowCount ?? 0) > 0
}

async function draftState(pollId: string, userId: string) {
    const { rowCount } = await db.query('SELECT 1 FROM ballot_drafts WHERE poll_id = $1 AND voter_key = $2', [pollId, userId])
    return (rowCount ?? 0) > 0
}

async function studentIdOf(userId: string | null) {
    if (!userId) return null
    const { rows } = await db.query<{ student_id: string | null }>('SELECT student_id FROM users WHERE id = $1', [userId])
    return rows[0]?.student_id ?? null
}

export async function toDetail(poll: PollRow, user: UserRow, origin: string): Promise<PollDetail> {
    const staff = isStaff(user, poll)
    const settings = settingsOf(poll)
    const [elements, submitted, reviews, closedBy, hasDraft] = await Promise.all([
        loadElements(poll.id),
        ballotState(poll.id, user.id),
        staff
            ? db.query<{ decision: Review['decision']; comment: string | null; created_at: Date }>(
                'SELECT decision, comment, created_at FROM reviews WHERE poll_id = $1 ORDER BY created_at DESC', [poll.id])
            : null,
        user.role === 'admin' ? studentIdOf(poll.closed_by) : null,
        draftState(poll.id, user.id),
    ])
    // รายชื่อรหัสของโพลแบบ codes เป็นข้อมูลภายใน ผู้ตอบเห็นแค่จำนวน
    const audience: Audience = poll.audience.type !== 'codes'
        ? poll.audience
        : { ...poll.audience, codes: staff ? poll.audience.codes : [], codeCount: poll.audience.codes.length }
    return {
        id: poll.id,
        status: poll.status,
        version: poll.version,
        title: poll.title,
        description: poll.description,
        coverImageUrl: poll.cover_image_url,
        closesAt: iso(poll.closes_at),
        submittedAt: iso(poll.submitted_at),
        openedAt: iso(poll.opened_at),
        closedAt: iso(poll.closed_at),
        closedEarly: poll.closed_early,
        closeReason: poll.close_reason,
        audience,
        settings,
        resultDisplay: resultDisplayOf(poll),
        // ของจริงเป็นลิงก์ของ CUNEX (UniversalLink) · mock ชี้หน้ากรอกในเว็บนี้
        shareUrl: poll.status === 'open' || poll.status === 'closed' ? `${origin}/${poll.id}` : null,
        elements,
        myBallot: { submitted, canEdit: submitted && settings.allowAnswerEdit && isAcceptingVotes(poll), hasDraft },
        canViewResults: canViewResults(user, poll, submitted),
        isOwner: poll.owner_id === user.id,
        ...(reviews && { reviews: reviews.rows.map((r) => ({ decision: r.decision, comment: r.comment, createdAt: r.created_at.toISOString() })) }),
        ...(user.role === 'admin' && { closedBy }),
        ...(staff && { takenDown: poll.taken_down, takedownReason: poll.takedown_reason }),
    }
}

export const SUMMARY_SQL = `
    SELECT p.*,
           (SELECT count(*)::int FROM elements e
            WHERE e.poll_id = p.id AND e.type IN ('text_question', 'single_choice', 'multi_choice', 'dropdown')) AS question_count
    FROM polls p`

export function toSummary(row: PollRow & { question_count: number }): PollSummary {
    return {
        id: row.id,
        status: row.status,
        title: row.title,
        description: row.description,
        coverImageUrl: row.cover_image_url,
        audience: row.audience.type,
        closesAt: iso(row.closes_at),
        openedAt: iso(row.opened_at),
        closedAt: iso(row.closed_at),
        closedEarly: row.closed_early,
        showResultsRealtime: !!row.settings.showResultsRealtime,
        allowRepeat: settingsOf(row).allowRepeat,
        questionCount: row.question_count,
        createdAt: row.created_at.toISOString(),
    }
}

// ── ฉบับร่าง ──

const str = (v: unknown, path: string, max = 10_000): string => {
    if (typeof v !== 'string') throw problem(400, 'BAD_REQUEST', `${path} ต้องเป็นข้อความ`)
    if (v.length > max) throw problem(422, 'TOO_LONG', `${path} ยาวเกิน ${max} ตัวอักษร`)
    return v
}
const optStr = (v: unknown, path: string, max = 10_000) => (v === undefined || v === null ? null : str(v, path, max))
const obj = (v: unknown, path: string): Record<string, unknown> => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw problem(400, 'BAD_REQUEST', `${path} ต้องเป็น object`)
    return v as Record<string, unknown>
}

const ELEMENT_TYPES = new Set<Element['type']>([
    'text_question', 'single_choice', 'multi_choice', 'dropdown', 'description', 'image', 'info_popup', 'accordion', 'page_break',
])

function parseOption(v: unknown, path: string): ElementOption {
    const o = obj(v, path)
    const popup = o.popup === undefined || o.popup === null ? null : obj(o.popup, `${path}.popup`)
    return {
        label: str(o.label ?? '', `${path}.label`, 500),
        description: optStr(o.description, `${path}.description`, 1000),
        imageUrl: optStr(o.imageUrl, `${path}.imageUrl`, 2000),
        imageAlt: optStr(o.imageAlt, `${path}.imageAlt`, 500),
        popup: popup && {
            buttonText: optStr(popup.buttonText, `${path}.popup.buttonText`, 100),
            title: str(popup.title ?? '', `${path}.popup.title`, 200),
            body: str(popup.body ?? '', `${path}.popup.body`, 5000),
        },
    }
}

// ตรวจแค่รูปข้อมูลตอนบันทึกร่าง (ร่างยังไม่ครบได้) · ความครบถ้วนตรวจตอน submit
function parseElement(v: unknown, path: string): Element {
    const e = obj(v, path)
    const type = e.type as Element['type']
    if (!ELEMENT_TYPES.has(type)) throw problem(400, 'BAD_REQUEST', `${path}.type ไม่รู้จัก`)
    const config = e.config === undefined ? {} : obj(e.config, `${path}.config`)
    const base = {
        type,
        title: optStr(e.title, `${path}.title`, 500),
        isRequired: e.isRequired === true,
        config,
    }
    if (type === 'single_choice' || type === 'multi_choice' || type === 'dropdown') {
        const options = e.options ?? []
        if (!Array.isArray(options)) throw problem(400, 'BAD_REQUEST', `${path}.options ต้องเป็น array`)
        return { ...base, options: options.map((o, i) => parseOption(o, `${path}.options[${i}]`)) } as Element
    }
    return base as Element
}

export function parseAudience(v: unknown): Audience {
    const a = obj(v, 'audience')
    if (a.type === 'public' || a.type === 'chula') return { type: a.type }
    if (a.type === 'codes') {
        if (a.codeKind !== 'STUDENT' && a.codeKind !== 'STAFF') throw problem(400, 'BAD_REQUEST', 'audience.codeKind ต้องเป็น STUDENT หรือ STAFF')
        if (!Array.isArray(a.codes) || !a.codes.every((c) => typeof c === 'string')) throw problem(400, 'BAD_REQUEST', 'audience.codes ต้องเป็น array ของ string')
        const pattern = a.codeKind === 'STAFF' ? /^\d{8}$/ : /^\d{10}$/
        const codes = [...new Set((a.codes as string[]).map((c) => c.trim()).filter(Boolean))]
        const bad = codes.filter((c) => !pattern.test(c))
        if (bad.length > 0) throw problem(422, 'INVALID_CODES', `รหัส${a.codeKind === 'STAFF' ? 'บุคลากร 8' : 'นิสิต 10'} หลักไม่ถูกรูปแบบ ${bad.length} รายการ`)
        return { type: 'codes', codeKind: a.codeKind, codes }
    }
    if (a.type !== 'restricted') throw problem(400, 'BAD_REQUEST', 'audience.type ต้องเป็น public, chula, restricted หรือ codes')
    if (!Array.isArray(a.rules)) throw problem(400, 'BAD_REQUEST', 'audience.rules ต้องเป็น array')
    return {
        type: 'restricted',
        rules: a.rules.map((r, i) => {
            const rule = obj(r, `audience.rules[${i}]`)
            const year = rule.studentYear
            if (year !== null && year !== undefined && !Number.isInteger(year)) {
                throw problem(400, 'BAD_REQUEST', `audience.rules[${i}].studentYear ต้องเป็นปี พ.ศ. หรือ null`)
            }
            return {
                facultyCode: str(rule.facultyCode ?? '', `audience.rules[${i}].facultyCode`, 10),
                departmentCode: optStr(rule.departmentCode, `audience.rules[${i}].departmentCode`, 20),
                studentYear: (year as number | undefined) ?? null,
            }
        }),
    }
}

// รับ body ของ POST/PUT /polls แล้วคืนค่าที่ผ่านการตรวจแล้ว (ช่องที่ไม่ส่งมา = ไม่มีใน object)
export async function parseDraft(body: Record<string, unknown>): Promise<PollDraft> {
    const draft: PollDraft = {}
    if (body.title !== undefined) draft.title = str(body.title, 'title', 200)
    if (body.description !== undefined) draft.description = str(body.description, 'description', 5000)
    if (body.coverImageUrl !== undefined) draft.coverImageUrl = optStr(body.coverImageUrl, 'coverImageUrl', 2000)
    if (body.closesAt !== undefined) {
        if (body.closesAt !== null && (typeof body.closesAt !== 'string' || Number.isNaN(Date.parse(body.closesAt)))) {
            throw problem(400, 'BAD_REQUEST', 'closesAt ต้องเป็นวันเวลา ISO-8601')
        }
        draft.closesAt = body.closesAt as string | null
    }
    if (body.audience !== undefined) draft.audience = parseAudience(body.audience)
    if (body.settings !== undefined) {
        const s = obj(body.settings, 'settings')
        draft.settings = {}
        for (const key of ['showResultsRealtime', 'allowAnswerEdit', 'listedPublicly', 'allowRepeat', 'identifySender'] as const) {
            if (s[key] !== undefined) draft.settings[key] = s[key] === true
        }
    }
    if (body.elements !== undefined) {
        if (!Array.isArray(body.elements)) throw problem(400, 'BAD_REQUEST', 'elements ต้องเป็น array')
        if (body.elements.length > 200) throw problem(422, 'TOO_MANY_ELEMENTS', 'โพลมีได้ไม่เกิน 200 องค์ประกอบ')
        draft.elements = body.elements.map((e, i) => parseElement(e, `elements[${i}]`))
    }

    // คณะต้องมีในรายการ /faculties
    if (draft.audience?.type === 'restricted') {
        const codes = draft.audience.rules.map((r) => r.facultyCode)
        const { rows } = await db.query<{ code: string }>('SELECT code FROM faculties WHERE code = ANY($1)', [codes])
        const known = new Set(rows.map((r) => r.code))
        const unknown = [...new Set(codes.filter((c) => !known.has(c)))]
        if (unknown.length > 0) throw problem(422, 'UNKNOWN_FACULTY', 'มีคณะที่ไม่รู้จัก', { facultyCodes: unknown })
        // [เสนอเพิ่ม] สาขาต้องอยู่ในคณะของกฎนั้น
        const depts = draft.audience.rules.filter((r) => r.departmentCode)
        if (depts.length > 0) {
            const { rows: known } = await db.query<{ code: string; faculty_code: string }>(
                'SELECT code, faculty_code FROM departments WHERE code = ANY($1)', [depts.map((r) => r.departmentCode)])
            const bad = depts.filter((r) => !known.some((k) => k.code === r.departmentCode && k.faculty_code === r.facultyCode))
            if (bad.length > 0) throw problem(422, 'UNKNOWN_DEPARTMENT', 'มีสาขาที่ไม่รู้จัก หรือไม่อยู่ในคณะที่เลือก')
        }
    }

    // รูปทุกรูปต้องเป็นลิงก์ที่ระบบออกให้ (ผ่าน POST /images/uploads) ห้ามลิงก์ภายนอก
    const bad = imageUrls(draft).filter(({ url }) => !isOurImageUrl(url))
    if (bad.length > 0) {
        throw problem(422, 'INVALID_IMAGE_URL', 'มีรูปที่ไม่ได้อัปโหลดผ่านระบบ', {
            problems: bad.map(({ path }) => ({ path, message: 'ต้องอัปโหลดรูปผ่านระบบ' })),
        })
    }
    return draft
}

export function imageUrls(draft: PollDraft): { path: string; url: string }[] {
    const found: { path: string; url: string }[] = []
    if (draft.coverImageUrl) found.push({ path: 'coverImageUrl', url: draft.coverImageUrl })
    draft.elements?.forEach((e, i) => {
        if (e.type === 'image' && e.config.url) found.push({ path: `elements[${i}].config.url`, url: e.config.url })
        if (e.type === 'info_popup' && e.config.imageUrl) found.push({ path: `elements[${i}].config.imageUrl`, url: e.config.imageUrl })
        if (isChoice(e)) e.options.forEach((o, j) => {
            if (o.imageUrl) found.push({ path: `elements[${i}].options[${j}].imageUrl`, url: o.imageUrl })
        })
    })
    return found
}

// เขียนทับฉบับร่างทั้งก้อนในทรานแซกชันเดียว · id ของ element/option สร้างใหม่ทุกครั้ง
export async function writeDraft(client: PoolClient, pollId: string, draft: PollDraft) {
    const sets: string[] = []
    const values: unknown[] = [pollId]
    const put = (col: string, value: unknown) => { values.push(value); sets.push(`${col} = $${values.length}`) }
    if (draft.title !== undefined) put('title', draft.title)
    if (draft.description !== undefined) put('description', draft.description)
    if (draft.coverImageUrl !== undefined) put('cover_image_url', draft.coverImageUrl)
    if (draft.closesAt !== undefined) put('closes_at', draft.closesAt)
    if (draft.audience !== undefined) put('audience', JSON.stringify(draft.audience))
    if (draft.settings !== undefined) {
        values.push(JSON.stringify(draft.settings))
        sets.push(`settings = settings || $${values.length}::jsonb`)
    }
    sets.push('updated_at = now()')
    await client.query(`UPDATE polls SET ${sets.join(', ')} WHERE id = $1`, values)

    if (draft.elements === undefined) return
    await client.query('DELETE FROM elements WHERE poll_id = $1', [pollId])
    for (const [i, e] of draft.elements.entries()) {
        const { rows } = await client.query<{ id: string }>(
            'INSERT INTO elements (poll_id, position, type, title, is_required, config) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [pollId, i + 1, e.type, e.title ?? null, isQuestion(e) ? e.isRequired === true : false, JSON.stringify(e.config ?? {})],
        )
        if (!isChoice(e)) continue
        for (const [j, o] of e.options.entries()) {
            await client.query(
                `INSERT INTO options (element_id, position, label, description, image_url, image_alt, popup)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [rows[0].id, j + 1, o.label, o.description ?? null, o.imageUrl ?? null, o.imageAlt ?? null, o.popup ? JSON.stringify(o.popup) : null],
            )
        }
    }
}

const OPTION_LIMITS: Record<string, number> = { single_choice: 50, multi_choice: 50, dropdown: 200 }

// ตรวจความครบก่อนส่งขออนุมัติ คืนทุกปัญหาที่เจอในครั้งเดียว
export function completenessProblems(poll: PollRow, elements: Element[]): { path: string; message: string }[] {
    const problems: { path: string; message: string }[] = []
    const add = (path: string, message: string) => problems.push({ path, message })
    if (!poll.title.trim()) add('title', 'ต้องมีชื่อโพล')
    if (!poll.closes_at) add('closesAt', 'ต้องตั้งเวลาปิดโหวต')
    else if (poll.closes_at <= new Date()) add('closesAt', 'เวลาปิดโหวตต้องอยู่ในอนาคต')
    if (poll.audience.type === 'restricted' && poll.audience.rules.length === 0) add('audience.rules', 'เลือกคณะอย่างน้อยหนึ่งคณะ')
    if (poll.audience.type === 'codes' && poll.audience.codes.length === 0) add('audience.codes', 'ใส่รหัสอย่างน้อยหนึ่งรหัส')
    if (!elements.some(isQuestion)) add('elements', 'ต้องมีคำถามอย่างน้อยหนึ่งข้อ')

    elements.forEach((e, i) => {
        const p = `elements[${i}]`
        if (isQuestion(e) && !e.title?.trim()) add(`${p}.title`, 'ต้องมีคำถาม')
        if (isChoice(e)) {
            const max = OPTION_LIMITS[e.type]
            if (e.options.length < 2 || e.options.length > max) add(`${p}.options`, `ต้องมีตัวเลือก 2–${max} ตัว`)
            e.options.forEach((o, j) => { if (!o.label.trim()) add(`${p}.options[${j}].label`, 'ตัวเลือกต้องมีข้อความ') })
            if (e.type !== 'dropdown' && e.config.layout === 'grid') {
                e.options.forEach((o, j) => { if (!o.imageUrl) add(`${p}.options[${j}].imageUrl`, 'แบบรูปใหญ่ต้องมีรูปทุกตัวเลือก') })
            }
            if (e.type === 'multi_choice') {
                const { minSelect, maxSelect } = e.config
                if (minSelect != null && maxSelect != null && minSelect > maxSelect) add(`${p}.config`, 'minSelect ต้องไม่เกิน maxSelect')
                if (maxSelect != null && maxSelect > e.options.length) add(`${p}.config.maxSelect`, 'เลือกได้มากกว่าจำนวนตัวเลือกไม่ได้')
            }
        }
        if (e.type === 'text_question' && e.config.maxLength != null && (e.config.maxLength < 1 || e.config.maxLength > 5000)) {
            add(`${p}.config.maxLength`, 'maxLength ต้องอยู่ระหว่าง 1–5000')
        }
        if (e.type === 'image' && !e.config.url) add(`${p}.config.url`, 'ต้องใส่รูป')
        if ((e.type === 'info_popup' || e.type === 'accordion') && (!e.config.title?.trim() || !e.config.body?.trim())) {
            add(`${p}.config`, 'ต้องมีหัวข้อและเนื้อหา')
        }
        if (e.type === 'description' && !(e.config.sections ?? []).some((s) => s.body?.trim())) add(`${p}.config.sections`, 'ต้องมีเนื้อหา')
    })
    return problems
}
