'use client'
import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from '@/api'
import type { Page, PollSummary } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PollSearch } from '@/components/common/search'
import { PollGrid } from '@/containers/page/main/components/pollGrid'
import { ExploreActions } from './exploreActions'

type FeedStatus = 'open' | 'closed'

const EMPTY = {
    open: { title: 'ยังไม่มีโพลที่เปิดให้กรอก', description: 'เมื่อมีโพลเปิดโหวต จะแสดงที่นี่ให้เข้าไปตอบได้' },
    closed: { title: 'ยังไม่มีโพลที่ปิดแล้ว', description: 'โพลที่ปิดโหวตแล้วจะอยู่ที่นี่ เข้าไปดูผลได้ถ้าเจ้าของเผยแพร่ไว้' },
}

// รายการโพลแบบ cursor: กด "โหลดเพิ่ม" ต่อท้ายรายการเดิม (cursor ย้อนกลับไม่ได้ จึงไม่ทำเป็นเลขหน้า)
function useFeed(status: FeedStatus, initial: Page<PollSummary>, pageSize: number) {
    const [items, setItems] = useState(initial.items)
    const [cursor, setCursor] = useState(initial.nextCursor)
    const [loading, setLoading] = useState(false)
    const loadMore = async () => {
        if (!cursor) return
        setLoading(true)
        try {
            const page = await api.polls.feed({ status, cursor, limit: pageSize })
            setItems((prev) => [...prev, ...page.items.filter((p) => !prev.some((x) => x.id === p.id))])
            setCursor(page.nextCursor)
        } catch (err) {
            toast.error(errorMessage(err, 'โหลดโพลเพิ่มไม่สำเร็จ'))
        } finally {
            setLoading(false)
        }
    }
    return { items, hasMore: cursor !== null, loading, loadMore }
}

export function ExploreFeed({ initial, pageSize }: { initial: Record<FeedStatus, Page<PollSummary>>; pageSize: number }) {
    const feeds = { open: useFeed('open', initial.open, pageSize), closed: useFeed('closed', initial.closed, pageSize) }
    return (
        <>
            {/* ค้นหาจากโพลที่โหลดมาแล้วของทั้งสองแท็บ */}
            <PollSearch polls={[...feeds.open.items, ...feeds.closed.items]} linkTarget='vote' />
            <Tabs defaultValue='open' className='w-full'>
                <TabsList variant='line' className='flex w-full *:text-base *:font-bold'>
                    <TabsTrigger value='open'>กำลังเปิด</TabsTrigger>
                    <TabsTrigger value='closed'>ปิดแล้ว</TabsTrigger>
                </TabsList>
                {(['open', 'closed'] as const).map((status) => {
                    const feed = feeds[status]
                    return (
                        <TabsContent key={status} value={status} className='flex flex-col gap-4'>
                            <PollGrid
                                polls={feed.items}
                                empty={EMPTY[status]}
                                renderAction={(poll) => <ExploreActions poll={poll} />}
                            />
                            {feed.hasMore && (
                                <Button
                                    variant='outline'
                                    className='self-center rounded-full px-6 font-heading text-base font-bold'
                                    disabled={feed.loading}
                                    aria-busy={feed.loading}
                                    onClick={feed.loadMore}
                                >
                                    {feed.loading && <Loader2 className='animate-spin' />}
                                    โหลดเพิ่ม
                                </Button>
                            )}
                        </TabsContent>
                    )
                })}
            </Tabs>
        </>
    )
}
