import { notFound, redirect } from 'next/navigation'
import { CreateContainer } from '@/containers/page/create/createContianer'
import { toDraftInitial } from '@/containers/page/create/draftInitial'
import { getPollDetail } from '@/lib/polls'

// หน้าแก้ไขฉบับร่าง: โหลดโพลจาก DB มาใส่ฟอร์มสร้างโพล โพลที่ไม่ใช่ฉบับร่างแก้ไม่ได้จึงส่งไปหน้า dashboard
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const poll = await getPollDetail(id)
    if (!poll) notFound()
    if (poll.type !== 'DRAFT') redirect(`/dashboard/${id}`)
    return <CreateContainer key={poll.id} draft={toDraftInitial(poll)} />
}
