import { redirect } from 'next/navigation'
import { getServerApi, loadOrNotFound } from '@/api/server'
import { CreateContainer } from '@/containers/page/create/createContianer'
import { toDraftInitial } from '@/containers/page/create/draftInitial'

// หน้าแก้ไขฉบับร่าง: โหลดโพลมาใส่ฟอร์มสร้างโพล แก้ได้เฉพาะฉบับร่างและโพลที่ถูกปฏิเสธ (แก้แล้วส่งใหม่ได้)
// สถานะอื่นแก้ไม่ได้จึงส่งไปหน้า dashboard · ไม่ใช่เจ้าของจะได้ 404 จาก API
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const api = await getServerApi()
    const poll = await loadOrNotFound(() => api.polls.get(id), `/create/${id}`)
    if (!poll.isOwner) redirect(`/dashboard/${id}`)
    if (poll.status !== 'draft' && poll.status !== 'rejected') redirect(`/dashboard/${id}`)
    return <CreateContainer key={poll.id} draft={toDraftInitial(poll)} />
}
