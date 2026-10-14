import { VoteStepPage } from '@/containers/page/vote/step'

export default async function Page({ params }: { params: Promise<{ slug: string; page: string }> }) {
    const { slug, page } = await params
    return <VoteStepPage slug={slug} page={page} />
}
