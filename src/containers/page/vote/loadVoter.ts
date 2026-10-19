import 'server-only'
import { redirect } from 'next/navigation'
import { getMe, getServerApi, loadOrNotFound } from '@/api/server'
import { toVoterPoll } from '@/lib/voteForm'

// ข้อมูลที่ทุกหน้าของผู้ตอบใช้: โพล (แปลงเป็นโมเดลหน้ากรอก) + ผู้ใช้ปัจจุบัน
// โพลที่ไม่มีหรือผู้ใช้ไม่มีสิทธิ์เห็น API ตอบ 404 → หน้า not found ของกลุ่มหน้านี้
export async function loadVoterPoll(slug: string, returnTo: string) {
    const me = await getMe()
    if (!me) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
    const api = await getServerApi()
    const [detail, faculties] = await loadOrNotFound(() => Promise.all([api.polls.get(slug), api.faculties()]), returnTo)
    return { me, detail, poll: toVoterPoll(detail, faculties), api }
}
