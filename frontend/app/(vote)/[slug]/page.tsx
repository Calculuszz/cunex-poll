import { VoteIntroPage } from '@/containers/page/vote/intro'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    return <VoteIntroPage slug={slug} />
}
