import { PublishSettingsPage } from '@/containers/page/dashboard/publish/publish'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    return <PublishSettingsPage slug={slug} />
}
