import type { CreateInput } from '@/lib/pollInput'
import { connection } from 'next/server'
import { DEFAULT_DISPLAY, parseDisplaySettings, type ResultDisplaySettings } from '@/lib/resultDisplay'
import { pool } from '@/lib/db'
import { toPollCardDTO, type IPollCardDTO } from '@/dtos/pollcardDto'

const LIST_SQL = `
    SELECT
        p.id,
        p.type,
        p.scope,
        p.realtime,
        p.title,
        p.description AS "desc",
        p.close_at AS "close",
        p.closed_at AS "closedAt",
        p.closed_early AS "closedEarly",
        p.show_explore AS "showExplore",
        (p.identify_sender AND p.scope <> 'C') AS "identifySender",
        (SELECT count(*)::int FROM poll_items i WHERE i.poll_id = p.id AND i.data->>'kind' = 'input') AS question
    FROM polls p
    ORDER BY p.created_at DESC
`

const DETAIL_SQL = `
    SELECT
        p.id,
        p.type,
        p.scope,
        p.realtime,
        p.allow_repeat AS "allowRepeat",
        p.identify_sender AS "identifySender",
        p.title,
        p.description AS "desc",
        p.close_at AS "close",
        p.closed_at AS "closedAt",
        p.closed_early AS "closedEarly",
        p.close_reason AS "closeReason",
        p.closed_by AS "closedBy",
        p.audience,
        p.result_display AS "resultDisplay"
    FROM polls p
    WHERE p.id = $1
`

export type PollItemRow = { position: number; data: Record<string, unknown> }

export type PollDetail = IPollCardDTO & {
    allowRepeat: boolean
    identifySender: boolean
    closeReason: string | null
    // ข้อมูลภายใน ห้ามส่งไปหน้าสาธารณะ (System flow §7)
    closedBy: string | null
    audience: { faculties: string[]; departments: string[]; studentCodes: string[]; codeKind?: 'STUDENT' | 'STAFF' }
    resultDisplay: ResultDisplaySettings
    items: PollItemRow[]
}

// ใช้ได้ทั้ง route handler และ server component
// connection() ทำให้หน้าไม่ถูก prerender ตอน build เพราะข้อมูลต้องดึงจาก DB ตอนมี request
export async function getPolls(): Promise<IPollCardDTO[]> {
    await connection()
    const { rows } = await pool.query(LIST_SQL)
    return rows.map(toPollCardDTO)
}

// หน้ารวมโพล: เฉพาะโพลที่กำลังโหวต ยังไม่เลยเวลาปิด เจ้าของเปิดสวิตช์ "เพิ่มลงหน้า explore" และผู้ใช้มีสิทธิ์ตอบ
// แบบ D ต้องมีรหัสของผู้ใช้อยู่ในรายชื่อ · แบบ B ยังตรวจคณะไม่ได้ (ยังไม่มีข้อมูลคณะจาก SSO) จึงปล่อยผ่านไปก่อน
export async function getExplorePolls(studentId: string): Promise<IPollCardDTO[]> {
    await connection()
    const { rows } = await pool.query(
        LIST_SQL.replace(
            'FROM polls p',
            `FROM polls p
             WHERE p.type = 'VOTING' AND p.show_explore AND p.close_at > now()
               AND (p.scope <> 'D' OR p.audience->'studentCodes' ? $1)`,
        ),
        [studentId],
    )
    return rows.map(toPollCardDTO)
}

export async function getPollDetail(id: string): Promise<PollDetail | null> {
    await connection()
    const { rows } = await pool.query(DETAIL_SQL, [id])
    if (rows.length === 0) return null

    const { rows: items } = await pool.query<PollItemRow>(
        'SELECT position, data FROM poll_items WHERE poll_id = $1 ORDER BY position',
        [id],
    )
    const row = rows[0]
    return {
        ...toPollCardDTO(row),
        allowRepeat: row.allowRepeat,
        identifySender: row.identifySender,
        closeReason: row.closeReason,
        closedBy: row.closedBy,
        // โพลที่สร้างก่อนมีบางฟิลด์ใน audience (seed เป็น {}) จึงเติมค่าว่างให้ครบก่อนส่งให้ UI
        audience: {
            faculties: row.audience?.faculties ?? [],
            departments: row.audience?.departments ?? [],
            studentCodes: row.audience?.studentCodes ?? [],
            codeKind: row.audience?.codeKind,
        },
        resultDisplay: parseDisplaySettings(row.resultDisplay) ?? DEFAULT_DISPLAY,
        items,
    }
}

// เปลี่ยนสถานะได้เฉพาะโพลที่รออนุมัติอยู่ คืน false ถ้าไม่พบหรือสถานะไม่ตรง
export async function reviewPoll(id: string, status: 'APPROVED' | 'REJECTED'): Promise<'ok' | 'not_found' | 'not_pending'> {
    const { rowCount } = await pool.query(
        `UPDATE polls SET type = $2 WHERE id = $1 AND type = 'PENDING'`,
        [id, status],
    )
    if (rowCount === 1) return 'ok'

    const { rowCount: exists } = await pool.query('SELECT 1 FROM polls WHERE id = $1', [id])
    return exists === 1 ? 'not_pending' : 'not_found'
}

// ปิดรับคำตอบเอง: ได้เฉพาะโพลที่กำลังโหวต (System flow §7)
// close_at คงไว้เป็นเวลาที่ตั้งไว้เดิม ส่วนเวลาที่ปิดจริงเก็บที่ closed_at ให้หน้าจอโชว์คู่กันได้
export async function closePoll(id: string, reason: string | null, closedBy: string): Promise<'ok' | 'not_found' | 'not_voting'> {
    const { rowCount } = await pool.query(
        `UPDATE polls SET type = 'DONE', closed_at = now(), closed_early = now() < close_at, close_reason = $2, closed_by = $3
         WHERE id = $1 AND type = 'VOTING'`,
        [id, reason, closedBy],
    )
    if (rowCount === 1) return 'ok'

    const { rowCount: exists } = await pool.query('SELECT 1 FROM polls WHERE id = $1', [id])
    return exists === 1 ? 'not_voting' : 'not_found'
}

// สร้างโพลใหม่ (ไม่ส่ง id) หรือเขียนทับฉบับร่างเดิม (ส่ง id) ทั้งข้อมูลโพลและคำถามในทรานแซกชันเดียว
// แก้ได้เฉพาะโพลที่เป็นฉบับร่าง ส่วนโพลอื่นคืน not_draft
export async function savePoll(input: CreateInput, id?: string): Promise<{ id: string } | 'not_found' | 'not_draft'> {
    const values = [
        input.type, input.scope, input.title, input.desc, input.realtime,
        input.allowRepeat, input.showExplore, input.identifySender, input.close,
        JSON.stringify(input.audience),
    ]
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        let pollId: string
        if (id === undefined) {
            const { rows } = await client.query<{ id: string }>(
                `INSERT INTO polls (type, scope, title, description, realtime, allow_repeat, show_explore, identify_sender, close_at, audience)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 RETURNING id`,
                values,
            )
            pollId = rows[0].id
        } else {
            const { rowCount } = await client.query(
                `UPDATE polls SET type = $1, scope = $2, title = $3, description = $4, realtime = $5,
                    allow_repeat = $6, show_explore = $7, identify_sender = $8, close_at = $9, audience = $10
                 WHERE id = $11 AND type = 'DRAFT'`,
                [...values, id],
            )
            if (rowCount !== 1) {
                await client.query('ROLLBACK')
                const { rowCount: exists } = await pool.query('SELECT 1 FROM polls WHERE id = $1', [id])
                return exists ? 'not_draft' : 'not_found'
            }
            pollId = id
            await client.query('DELETE FROM poll_items WHERE poll_id = $1', [id])
        }

        for (const [index, item] of input.items.entries()) {
            await client.query(
                'INSERT INTO poll_items (poll_id, position, data) VALUES ($1, $2, $3)',
                [pollId, index + 1, JSON.stringify(item)],
            )
        }

        await client.query('COMMIT')
        return { id: pollId }
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
}

// กด Publish: APPROVED → VOTING (System flow §7) กดได้ทั้งเจ้าของและแอดมิน
// เลยเวลาปิดแล้วเปิดไม่ได้ (โพลที่ไม่เคยเปิดโหวตจะถูกตัดเป็น DONE)
export async function publishPoll(id: string): Promise<'ok' | 'not_found' | 'not_approved' | 'expired'> {
    const { rowCount } = await pool.query(
        `UPDATE polls SET type = 'VOTING' WHERE id = $1 AND type = 'APPROVED' AND close_at > now()`,
        [id],
    )
    if (rowCount === 1) return 'ok'

    const { rows } = await pool.query<{ type: string; expired: boolean }>(
        'SELECT type, close_at <= now() AS expired FROM polls WHERE id = $1',
        [id],
    )
    if (rows.length === 0) return 'not_found'
    return rows[0].type === 'APPROVED' && rows[0].expired ? 'expired' : 'not_approved'
}

// เปิด/ปิดผลเรียลไทม์ทีหลัง ได้เฉพาะก่อนเปิดโหวต (System flow §8) พอเข้า VOTING แล้วล็อก
export async function setRealtime(id: string, realtime: boolean): Promise<'ok' | 'not_found' | 'locked'> {
    const { rowCount } = await pool.query(
        `UPDATE polls SET realtime = $2 WHERE id = $1 AND type IN ('DRAFT', 'PENDING', 'APPROVED')`,
        [id, realtime],
    )
    if (rowCount === 1) return 'ok'

    const { rowCount: exists } = await pool.query('SELECT 1 FROM polls WHERE id = $1', [id])
    return exists === 1 ? 'locked' : 'not_found'
}

// เจ้าของโพลเห็นรหัสผู้ตอบเมื่อเปิดสวิตช์ "ระบุคนส่ง" (เช่นใช้ทำแบบทดสอบ) โพลสาธารณะไม่มีตัวตนให้ระบุ
// ใช้ตัดสินที่ API ว่าจะส่งรหัสผู้ตอบออกไปไหม ไม่ใช่ซ่อนที่ UI
export async function identifiesSender(id: string): Promise<boolean> {
    const { rows } = await pool.query<{ ok: boolean }>(
        `SELECT identify_sender AND scope <> 'C' AS ok FROM polls WHERE id = $1`,
        [id],
    )
    return rows[0]?.ok ?? false
}

// บันทึกการตั้งค่าเผยแพร่ผล ตั้งได้เฉพาะโพลที่เปิดโหวตแล้ว (ก่อนนั้นยังไม่มีผลให้เผยแพร่)
export async function saveResultDisplay(id: string, settings: ResultDisplaySettings): Promise<'ok' | 'not_found' | 'bad_state'> {
    const { rows } = await pool.query<{ type: string }>('SELECT type FROM polls WHERE id = $1', [id])
    if (rows.length === 0) return 'not_found'
    if (rows[0].type !== 'VOTING' && rows[0].type !== 'DONE') return 'bad_state'
    await pool.query('UPDATE polls SET result_display = $2 WHERE id = $1', [id, JSON.stringify(settings)])
    return 'ok'
}
