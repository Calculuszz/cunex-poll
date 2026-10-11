import { PollDashboardPage } from '@/containers/page/dashboard/dashboard'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    return <PollDashboardPage slug={slug} />
}
