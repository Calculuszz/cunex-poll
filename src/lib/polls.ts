import { connection } from 'next/server'
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
        p.show_explore AS "showExplore",
        p.identify_sender AS "identifySender",
        p.title,
        p.description AS "desc",
        p.close_at AS "close",
        p.audience
    FROM polls p
    WHERE p.id = $1
`

export type PollItemRow = { position: number; data: Record<string, unknown> }

export type PollDetail = IPollCardDTO & {
    allowRepeat: boolean
    showExplore: boolean
    identifySender: boolean
    audience: { faculties: string[]; departments: string[]; studentCodes: string[]; codeKind?: 'STUDENT' | 'STAFF' }
    items: PollItemRow[]
}

// ใช้ได้ทั้ง route handler และ server component
// connection() ทำให้หน้าไม่ถูก prerender ตอน build เพราะข้อมูลต้องดึงจาก DB ตอนมี request
export async function getPolls(): Promise<IPollCardDTO[]> {
    await connection()
    const { rows } = await pool.query(LIST_SQL)
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
        showExplore: row.showExplore,
        identifySender: row.identifySender,
        audience: row.audience,
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
