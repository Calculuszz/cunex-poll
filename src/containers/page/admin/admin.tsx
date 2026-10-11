import { AdminHeading } from "@/containers/page/admin/components/index"
import { ReviewActions } from "@/containers/page/admin/components/reviewActions"
import { AdminTabs } from '@/containers/widgets/tabs'
import { PollSearch } from '@/components/common/search'
import { PollGrid } from '@/containers/page/main/components/pollGrid'
import { getPolls } from '@/lib/polls'
import { pollHref } from '@/lib/pollHref'
import type { IPollCardDTO } from '@/dtos/pollcardDto'

// แท็บของแอดมินดึงโพลตามสถานะ: รออนุมัติ = PENDING, อนุมัติแล้ว = APPROVED, ปฏิเสธ = REJECTED
const ADMIN_TAB_STATUSES: Record<string, IPollCardDTO['type'][]> = {
    waiting: ['PENDING'],
    accept: ['APPROVED'],
    deny: ['REJECTED'],
}

export async function AdminPage() {
    const polls = await getPolls()

    return (
        <div className="flex flex-col gap-4">
            <AdminHeading />
            <PollSearch polls={polls} />
            <AdminTabs
                renderPanel={(tab) => (
                    <PollGrid
                        polls={polls.filter((poll) => ADMIN_TAB_STATUSES[tab]?.includes(poll.type))}
                        // ปุ่มพิจารณาโพลแสดงเฉพาะแท็บรออนุมัติ
                        renderAction={tab === 'waiting' ? (poll) => <ReviewActions pollId={poll.id} /> : undefined}
                        linkTo={pollHref}
                    />
                )}
            />
        </div>
    )
}
