import { AdminHeading } from "@/containers/page/admin/components/index"
import { AdminTabs } from '@/containers/widgets/tabs'
import { PollSearch } from '@/components/common/search'

export function AdminPage() {
    return (
        <div className="flex flex-col gap-4">
            <AdminHeading />
            <PollSearch/>
            <AdminTabs />
        </div>
    )
}
