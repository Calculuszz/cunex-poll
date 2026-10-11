import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { getPolls } from '@/lib/polls'

// backend ชั่วคราว: GET รายการโพล, POST สร้างโพลพร้อมคำถาม/องค์ประกอบ

const STATUSES = ['DRAFT', 'PENDING', 'APPROVED', 'VOTING', 'DONE'] as const
const SCOPES = ['A', 'B', 'C', 'D'] as const

type Audience = { faculties: string[]; departments: string[]; studentCodes: string[]; codeKind: 'STUDENT' | 'STAFF' }

type CreateInput = {
    type: (typeof STATUSES)[number]
    scope: (typeof SCOPES)[number]
    title: string
    desc: string
    realtime: boolean
    allowRepeat: boolean
    showExplore: boolean
    identifySender: boolean
    close: Date
    audience: Audience
    items: Record<string, unknown>[]
}

export async function GET() {
    return NextResponse.json(await getPolls())
}

export async function POST(request: Request) {
    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'body ต้องเป็น JSON' }, { status: 400 })
    }

    const parsed = parseCreateBody(body)
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const input = parsed.value

    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const { rows } = await client.query<{ id: string }>(
            `INSERT INTO polls (type, scope, title, description, realtime, allow_repeat, show_explore, identify_sender, close_at, audience)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id`,
            [
                input.type, input.scope, input.title, input.desc, input.realtime,
                input.allowRepeat, input.showExplore, input.identifySender, input.close,
                JSON.stringify(input.audience),
            ],
        )
        const pollId = rows[0].id

        for (const [index, item] of input.items.entries()) {
            await client.query(
                'INSERT INTO poll_items (poll_id, position, data) VALUES ($1, $2, $3)',
                [pollId, index + 1, JSON.stringify(item)],
            )
        }

        await client.query('COMMIT')
        return NextResponse.json({ id: pollId }, { status: 201 })
    } catch (err) {
        await client.query('ROLLBACK')
        console.error('สร้างโพลไม่สำเร็จ', err)
        return NextResponse.json({ error: 'บันทึกโพลไม่สำเร็จ' }, { status: 500 })
    } finally {
        client.release()
    }
}

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((v) => typeof v === 'string')

function parseAudience(value: unknown): Audience | null {
    if (value === undefined) return { faculties: [], departments: [], studentCodes: [], codeKind: 'STUDENT' }
    if (typeof value !== 'object' || value === null) return null
    const a = value as Record<string, unknown>
    const faculties = a.faculties ?? []
    const departments = a.departments ?? []
    const studentCodes = a.studentCodes ?? []
    const codeKind = a.codeKind ?? 'STUDENT'
    if (!isStringArray(faculties) || !isStringArray(departments) || !isStringArray(studentCodes)) return null
    if (codeKind !== 'STUDENT' && codeKind !== 'STAFF') return null
    // นิสิต 10 หลัก บุคลากร 8 หลัก ตรวจซ้ำที่ backend ด้วย ไม่พึ่งแค่ UI
    const pattern = codeKind === 'STAFF' ? /^\d{8}$/ : /^\d{10}$/
    if (studentCodes.some((code) => !pattern.test(code))) return null
    return { faculties, departments, studentCodes, codeKind }
}

function parseCreateBody(body: unknown): { ok: true; value: CreateInput } | { ok: false; error: string } {
    if (typeof body !== 'object' || body === null) return { ok: false, error: 'body ต้องเป็น object' }
    const b = body as Record<string, unknown>

    const title = typeof b.title === 'string' ? b.title.trim() : ''
    if (!title) return { ok: false, error: 'ต้องระบุชื่อโพล' }

    const scope = b.scope
    if (!SCOPES.includes(scope as (typeof SCOPES)[number])) return { ok: false, error: 'scope ต้องเป็น A, B, C หรือ D' }

    const type = b.type ?? 'DRAFT'
    if (!STATUSES.includes(type as (typeof STATUSES)[number])) return { ok: false, error: 'type ไม่ถูกต้อง' }

    if (typeof b.close !== 'string' || Number.isNaN(Date.parse(b.close))) {
        return { ok: false, error: 'close ต้องเป็นวันเวลาในรูปแบบ ISO' }
    }

    const audience = parseAudience(b.audience)
    if (!audience) return { ok: false, error: 'audience ต้องเป็น object ที่มี array ของ string' }

    const items = b.items ?? []
    if (!Array.isArray(items) || !items.every((i) => typeof i === 'object' && i !== null && 'kind' in i)) {
        return { ok: false, error: 'items ต้องเป็น array ของ object ที่มี kind' }
    }

    return {
        ok: true,
        value: {
            type: type as CreateInput['type'],
            scope: scope as CreateInput['scope'],
            title,
            desc: typeof b.desc === 'string' ? b.desc : '',
            realtime: b.realtime === true,
            allowRepeat: b.allowRepeat === true,
            showExplore: b.showExplore === true,
            identifySender: b.identifySender === true,
            close: new Date(b.close),
            audience,
            items: items as Record<string, unknown>[],
        },
    }
}
