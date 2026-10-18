import { AdminHeading } from "@/containers/page/admin/components/index"
import { ReviewActions } from "@/containers/page/admin/components/reviewActions"
import { AdminTabs } from '@/containers/widgets/tabs'
import { PollSearch } from '@/components/common/search'
import { PollGrid, type PollGridEmpty } from '@/containers/page/main/components/pollGrid'
import { getServerApi, loadOrNotFound } from '@/api/server'
import type { PollStatus, PollSummary } from '@/api/types'
import { adminPollHref } from '@/lib/pollHref'

// แท็บของแอดมิน: รออนุมัติ / อนุมัติแล้ว (รวมที่เปิดโหวตและปิดแล้ว ถอดโพลได้จากหน้าโพล) / ปฏิเสธ
const ADMIN_TAB_STATUSES: Record<string, PollStatus[]> = {
    waiting: ['pending_review'],
    accept: ['approved', 'open', 'closed'],
    deny: ['rejected'],
}

const ADMIN_TAB_EMPTY: Record<string, PollGridEmpty> = {
    waiting: { title: 'ไม่มีโพลที่รออนุมัติ', description: 'เมื่อมีคนส่งโพลขออนุมัติ จะแสดงที่นี่ให้พิจารณา' },
    accept: { title: 'ยังไม่มีโพลที่อนุมัติแล้ว', description: 'โพลที่กดยืนยันแล้วจะย้ายมาอยู่ที่นี่' },
    deny: { title: 'ยังไม่มีโพลที่ถูกปฏิเสธ', description: 'โพลที่กดปฏิเสธแล้วจะย้ายมาอยู่ที่นี่' },
}

const MAX_PAGES = 10

// คิวรออนุมัติเรียงส่งก่อนได้ก่อน (backend เรียงให้เมื่อขอ status=pending_review) ที่เหลือใหม่สุดก่อน
async function loadAdminPolls() {
    const api = await getServerApi()
    const all = async (status?: PollStatus) => {
        const items: PollSummary[] = []
        let cursor: string | null = null
        for (let i = 0; i < MAX_PAGES; i++) {
            const page = await api.admin.polls({ status, cursor, limit: 100 })
            items.push(...page.items)
            cursor = page.nextCursor
            if (!cursor) break
        }
        return items
    }
    const [pending, everything] = await Promise.all([all('pending_review'), all()])
    return [...pending, ...everything.filter((p) => p.status !== 'pending_review')]
}

export async function AdminPage() {
    const polls = await loadOrNotFound(loadAdminPolls, '/admin')

    return (
        <div className="flex flex-col gap-4">
            <AdminHeading />
            <PollSearch polls={polls} linkTarget='admin' />
            <AdminTabs
                renderPanel={(tab) => (
                    <PollGrid
                        polls={polls.filter((poll) => ADMIN_TAB_STATUSES[tab]?.includes(poll.status))}
                        // ปุ่มพิจารณาโพลแสดงเฉพาะแท็บรออนุมัติ
                        renderAction={tab === 'waiting' ? (poll) => <ReviewActions pollId={poll.id} /> : undefined}
                        linkTo={adminPollHref}
                        empty={ADMIN_TAB_EMPTY[tab]}
                    />
                )}
            />
        </div>
    )
}
