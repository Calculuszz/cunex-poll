import { RealtimePage } from '@/containers/page/dashboard/realtime/realtime'

export default async function Page({ params, searchParams }: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ view?: string; q?: string }>
}) {
    const [{ slug }, query] = await Promise.all([params, searchParams])
    return <RealtimePage slug={slug} view={query.view} q={query.q} />
}
