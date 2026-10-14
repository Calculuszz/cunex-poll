import { VoteDonePage } from '@/containers/page/vote/done'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    return <VoteDonePage slug={slug} />
}
