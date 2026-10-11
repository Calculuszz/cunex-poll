"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { Input } from '../ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Badge } from '../ui/badge'
import { Search } from "lucide-react"
import { useDebouncedField } from '@/hooks/useDebouncedField'
import { SCOPE_LABEL, STATUS_LABEL } from '@/lib/pollLabels'
import type { IPollCardDTO } from '@/dtos/pollcardDto'
import { pollHref } from '@/lib/pollHref'

// ค้นหาเฉพาะโพลที่อยู่ในหน้านั้น ผลลัพธ์แสดงเป็น popup ใต้ช่องค้นหา
export function PollSearch({ polls }: { polls: IPollCardDTO[] }) {
    const [query, setQuery] = useState('')
    // ช่องพิมพ์แสดงผลทันที ส่วนการกรองใช้ query ที่ debounce แล้ว
    const [input, setInput] = useDebouncedField(query, setQuery)
    // ปิด popup ด้วย Escape หรือคลิกข้างนอกแล้ว จะเปิดใหม่เมื่อพิมพ์ต่อ
    const [dismissed, setDismissed] = useState(false)

    const keyword = query.trim().toLowerCase()
    const results = keyword
        ? polls.filter((poll) =>
            poll.title.toLowerCase().includes(keyword) || poll.desc.toLowerCase().includes(keyword))
        : []
    const open = keyword !== '' && !dismissed

    return (
        <Popover
            open={open}
            // คลิกช่องค้นหาไม่ควรสลับ popup เอง จึงข้ามเหตุการณ์จากการคลิก trigger
            onOpenChange={(next, details) => { if (!next && details.reason !== 'trigger-press') setDismissed(true) }}
        >
            <PopoverTrigger nativeButton={false} render={<div className='py-2 relative max-w-100' />}>
                <Search size={20} className='absolute top-1/2 -translate-y-1/2 left-2 text-ink-400'/>
                <Input
                    value={input}
                    onChange={(e) => { setInput(e.target.value); setDismissed(false) }}
                    placeholder='ค้นหา...'
                    className='pl-8 h-10 text-lg!'
                    role='combobox'
                    aria-expanded={open}
                    aria-label='ค้นหาโพล'
                />
            </PopoverTrigger>
            <PopoverContent
                    initialFocus={false}
                    finalFocus={false}
                    className='w-(--anchor-width) max-h-80 overflow-y-auto p-1'
                    aria-label='ผลการค้นหา'
                >
                    {results.length === 0 ? (
                        <p className='px-2 py-3 text-base text-ink-500'>ไม่พบโพลที่ตรงกับ “{query.trim()}”</p>
                    ) : (
                        <ul className='flex flex-col'>
                            {results.map((poll) => (
                                <li key={poll.id}>
                                    <Link
                                        href={pollHref(poll)}
                                        className='flex flex-col gap-1 rounded-md px-2 py-2 outline-none transition-colors duration-150 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring'
                                    >
                                        <span className='font-heading text-base font-bold line-clamp-1'>{poll.title}</span>
                                        <div className='flex flex-wrap gap-1'>
                                            <Badge variant='secondary'>{STATUS_LABEL[poll.type]}</Badge>
                                            <Badge variant='outline'>{SCOPE_LABEL[poll.scope]}</Badge>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </PopoverContent>
        </Popover>
    )
}
