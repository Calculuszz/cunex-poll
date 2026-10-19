import React from 'react'
import { formatOptionNumbers, type DisplayNumbers, type DisplayOption } from '@/lib/resultDisplay'
import { optionColor } from '@/lib/resultView'

// แถบยาวเทียบกับตัวเลือกที่ได้มากสุด (อันดับหนึ่งเต็มแถบ) แต่ตัวเลขร้อยละยังคิดจากผู้ตอบทั้งหมด
// ใช้ scaleX แทน width ให้ตอนตัวเลขเปลี่ยนแบบเรียลไทม์ไม่ต้องคำนวณ layout ใหม่
// total / ตัวเลขแต่ละแบบเป็น null ได้เมื่อเจ้าของโพลซ่อนไว้ (หน้าผลของผู้ตอบ)
export function ResultListView({ options, numbers, total, showHeader }: {
    options: DisplayOption[]
    numbers: DisplayNumbers
    total: number | null
    showHeader?: boolean
}) {
    return (
        <div className='flex flex-col gap-3'>
            {showHeader && total !== null && <p className='font-bold'>ตอบแล้ว {total.toLocaleString('th-TH')} คน</p>}
            <ul className='flex flex-col gap-3'>
                {options.map((o, i) => (
                    <li key={o.id} className='flex flex-col gap-1.5'>
                        <div className='flex items-baseline justify-between gap-3'>
                            <span className='min-w-0 break-words'>{o.label}</span>
                            <span className='shrink-0 text-sm text-ink-500 tabular-nums'>{formatOptionNumbers(o, numbers)}</span>
                        </div>
                        <div className='h-2 overflow-hidden rounded-full bg-rose-50'>
                            <div
                                className='h-full origin-left rounded-full transition-transform duration-300 ease-out'
                                style={{ background: optionColor(i, options.length), transform: `scaleX(${o.weight})` }}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}
