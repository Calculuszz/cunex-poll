'use client'
import React from 'react'
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useElementStore, type FormItem } from '@/store/elementStore'
export function FormItemCard({
    item,
    position,
    number,
    title,
    children,
}: {
    item: FormItem
    /** ตำแหน่งจริงในลิสต์รวม ใช้เลื่อนขึ้น/ลง */
    position: number
    /** เลขที่แสดงบนหัวการ์ด นับแยกกันระหว่างคำถามกับองค์ประกอบ */
    number: number
    title: string
    children: React.ReactNode
}) {
    const move = useElementStore((s) => s.move)
    const remove = useElementStore((s) => s.remove)
    const total = useElementStore((s) => s.items.length)

    const isFirst = position === 0
    const isLast = position === total - 1

    return (
        <Card>
            <CardContent className='flex flex-col gap-3'>
                <div className='flex items-start justify-between gap-2'>
                    <span className='font-heading text-base font-bold'>{item.kind == "input" ? "ข้อที่": "องค์ประกอบที่"} {number}<br />{title}</span>
                    <div className='flex items-center gap-1'>
                        <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            aria-label='เลื่อนขึ้น'
                            disabled={isFirst}
                            className='bg-transparent text-ink-500 hover:bg-secondary hover:text-ink-900'
                            onClick={() => move(position, position - 1)}
                        >
                            <ChevronUp />
                        </Button>
                        <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            aria-label='เลื่อนลง'
                            disabled={isLast}
                            className='bg-transparent text-ink-500 hover:bg-secondary hover:text-ink-900'
                            onClick={() => move(position, position + 1)}
                        >
                            <ChevronDown />
                        </Button>
                        <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            aria-label='ลบรายการนี้'
                            className='text-ink-500 hover:bg-red-100 hover:text-red-200'
                            onClick={() => remove(item.id)}
                        >
                            <Trash2 />
                        </Button>
                    </div>
                </div>

                {children}
            </CardContent>
        </Card>
    )
}
