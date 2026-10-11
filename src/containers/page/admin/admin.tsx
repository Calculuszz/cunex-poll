import { AdminHeading } from "@/containers/page/admin/components/index"
import { AdminTabs } from '@/containers/widgets/tabs'
import { PollSearch } from '@/components/common/search'
import { PollGrid } from '@/containers/page/main/components/pollGrid'
import { MOCK_POLLS } from '@/containers/page/main/mockPolls'
import type { IPollCardDTO } from '@/dtos/pollcardDto'

// แท็บของแอดมินดึงโพลตามสถานะ: รออนุมัติ = PENDING, อนุมัติแล้ว = APPROVED
// ปฏิเสธยังไม่มีสถานะในโมเดลข้อมูล จึงว่างไว้ก่อน
const ADMIN_TAB_STATUSES: Record<string, IPollCardDTO['type'][]> = {
    waiting: ['PENDING'],
    accept: ['APPROVED'],
    deny: [],
}

export function AdminPage() {
    return (
        <div className="flex flex-col gap-4">
            <AdminHeading />
            <PollSearch/>
            <AdminTabs
                renderPanel={(tab) => (
                    <PollGrid polls={MOCK_POLLS.filter((poll) => ADMIN_TAB_STATUSES[tab]?.includes(poll.type))} />
                )}
            />
        </div>
    )
}
