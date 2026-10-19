import { VoteResultsPage } from '@/containers/page/vote/results'

export default async function Page({ params, searchParams }: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ submitted?: string }>
}) {
    const [{ slug }, query] = await Promise.all([params, searchParams])
    return <VoteResultsPage slug={slug} submitted={query.submitted === '1'} />
}
