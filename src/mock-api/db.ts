import 'server-only'
import { Pool, type PoolClient } from 'pg'

// backend ชั่วคราว (mock ของ api-endpoints v1) ใช้ schema v1 แยกจากตารางชุดเก่า
// ไม่มีโค้ดฝั่งหน้าเว็บ import ไฟล์ในโฟลเดอร์นี้ หน้าเว็บคุยผ่าน HTTP (/api/v1) อย่างเดียว พอมี backend จริงลบทั้งโฟลเดอร์ได้เลย
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL ยังไม่ได้ตั้งค่า ดูตัวอย่างใน .env.example')
}

const globalForDb = globalThis as unknown as { mockApiPool?: Pool }

export const db = globalForDb.mockApiPool ?? new Pool({
    connectionString: process.env.DATABASE_URL,
    options: '-c search_path=v1',
})

if (process.env.NODE_ENV !== 'production') globalForDb.mockApiPool = db

export async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await db.connect()
    try {
        await client.query('BEGIN')
        const result = await fn(client)
        await client.query('COMMIT')
        return result
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
}
