import { MyAnswersPage } from '@/containers/page/vote/myAnswers'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    return <MyAnswersPage slug={slug} />
}
