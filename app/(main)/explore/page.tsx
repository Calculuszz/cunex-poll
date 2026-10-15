import { ExplorePage } from '@/containers/page/explore/main'

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const { page } = await searchParams
    return <ExplorePage page={page} />
}
