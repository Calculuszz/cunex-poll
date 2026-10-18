import { findUser, startSession, toMe } from '@/mock-api/auth'
import { json, problem, readJson, route } from '@/mock-api/http'

// บัญชีทดสอบ เปิดเฉพาะตอนไม่ใช่ production (APP_ENV)
const ACCOUNTS = { user: '6730000121', admin: '6734414223' } as const

export const POST = route(async (request) => {
    if ((process.env.APP_ENV ?? process.env.NODE_ENV) === 'production') throw problem(404, 'NOT_FOUND', 'ไม่พบ')
    const { role } = await readJson(request)
    if (role !== 'user' && role !== 'admin') throw problem(400, 'BAD_REQUEST', 'role ต้องเป็น user หรือ admin')
    const user = await findUser('u.student_id', ACCOUNTS[role])
    if (!user) throw problem(500, 'INTERNAL', 'ไม่พบบัญชีทดสอบ')
    await startSession(user.id)
    return json(toMe(user))
})
