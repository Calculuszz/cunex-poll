import { Pool } from 'pg'

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL ยังไม่ได้ตั้งค่า ดูตัวอย่างใน .env.example')
}

// เก็บ pool ไว้บน globalThis เพื่อไม่ให้ dev server สร้าง connection ใหม่ทุกครั้งที่ HMR รีโหลดโมดูล
const globalForDb = globalThis as unknown as { pgPool?: Pool }

export const pool = globalForDb.pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL })

if (process.env.NODE_ENV !== 'production') globalForDb.pgPool = pool
