import React from 'react'
import type { ResultOption } from '@/lib/pollResultTypes'
import { formatCountPct, optionColor } from '@/lib/resultView'

// แถบยาวเทียบกับตัวเลือกที่ได้มากสุด (อันดับหนึ่งเต็มแถบ) แต่ตัวเลขร้อยละยังคิดจากผู้ตอบทั้งหมด
// ใช้ scaleX แทน width ให้ตอนตัวเลขเปลี่ยนแบบเรียลไทม์ไม่ต้องคำนวณ layout ใหม่
export function ResultListView({ options, respondents, showHeader }: {
    options: ResultOption[]
    respondents: number
    showHeader?: boolean
}) {
    const max = Math.max(0, ...options.map((o) => o.count))
    return (
        <div className='flex flex-col gap-3'>
            {showHeader && <p className='font-bold'>ตอบแล้ว {respondents.toLocaleString('th-TH')} คน</p>}
            <ul className='flex flex-col gap-3'>
                {options.map((o, i) => (
                    <li key={o.id} className='flex flex-col gap-1.5'>
                        <div className='flex items-baseline justify-between gap-3'>
                            <span className='min-w-0 break-words'>{o.label}</span>
                            <span className='shrink-0 text-sm text-ink-500 tabular-nums'>{formatCountPct(o.count, respondents)}</span>
                        </div>
                        <div className='h-2 overflow-hidden rounded-full bg-rose-50'>
                            <div
                                className='h-full origin-left rounded-full transition-transform duration-300 ease-out'
                                style={{ background: optionColor(i, options.length), transform: `scaleX(${max === 0 ? 0 : o.count / max})` }}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}
