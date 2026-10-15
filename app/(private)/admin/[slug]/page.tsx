import { PollDashboardPage } from '@/containers/page/dashboard/dashboard'

// /admin/(slug) — แอดมินดูโพล + ผล + รายชื่อผู้ตอบ (System flow §4)
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    return <PollDashboardPage slug={slug} view='admin' />
}
