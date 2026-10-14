import React from 'react'
import { formatOptionNumbers, type DisplayNumbers, type DisplayOption } from '@/lib/resultDisplay'
import { optionColor } from '@/lib/resultView'

// วงแหวนรัศมี 37.5 เส้นหนา 25 ในกรอบ 100 → รัศมีในประมาณครึ่งหนึ่งของรัศมีนอก
const R = 37.5
const STROKE = 25

// โดนัทเขียนด้วย SVG: แต่ละชิ้นคือวงกลมเส้นประ pathLength=100 ที่เริ่มต้นเส้นของตัวเอง แล้วหมุนไปวางต่อชิ้นก่อนหน้า
// (ไม่ใช้ dashoffset เพราะ Chrome วาดรอยหยักตรงจุดที่เส้นประชนจุดปิดของวงกลม)
// ทั้งวงหมุน -90° ให้เริ่มที่ 12 นาฬิกาแล้ววนตามเข็ม และ transition ที่ dash/การหมุน ให้ชิ้นขยับนุ่มตอนค่าเปลี่ยน
export function ResultDonutView({ options, numbers, total }: { options: DisplayOption[]; numbers: DisplayNumbers; total: number | null }) {
    // สัดส่วนชิ้นคิดจากผลรวมคะแนน (แบบเลือกได้หลายข้อผลรวมจะมากกว่าจำนวนผู้ตอบ)
    // weight เป็นสัดส่วนเทียบตัวที่มากสุด จึงหารผลรวมแล้วได้สัดส่วนเดียวกับการใช้จำนวนคนจริง
    const sum = options.reduce((acc, o) => acc + o.weight, 0)
    const sizes = options.map((o) => (sum === 0 ? 0 : (o.weight / sum) * 100))
    const slices = options.map((o, i) => ({
        id: o.id,
        size: sizes[i],
        // จุดเริ่มของชิ้นนี้ = ผลรวมขนาดของชิ้นก่อนหน้า
        start: sizes.slice(0, i).reduce((acc, s) => acc + s, 0),
        color: optionColor(i, options.length),
    }))

    return (
        <div className='flex flex-col items-center gap-4'>
            <div className='relative size-58'>
                <svg viewBox='0 0 100 100' className='size-full -rotate-90' aria-hidden>
                    <circle cx='50' cy='50' r={R} fill='none' strokeWidth={STROKE} className='stroke-inner-bg' />
                    {slices.map((s) => (
                        <circle
                            key={s.id}
                            cx='50'
                            cy='50'
                            r={R}
                            fill='none'
                            pathLength={100}
                            strokeWidth={STROKE}
                            stroke={s.color}
                            strokeDasharray={`${s.size} ${100 - s.size}`}
                            style={{ transform: `rotate(${s.start * 3.6}deg)` }}
                            className='origin-center transition-[stroke-dasharray,transform] duration-300 ease-out'
                        />
                    ))}
                </svg>
                {total !== null && (
                    <span className='absolute inset-0 flex items-center justify-center font-heading text-xl font-bold'>
                        {total.toLocaleString('th-TH')} คน
                    </span>
                )}
            </div>
            <ul className='flex w-full flex-col gap-2'>
                {options.map((o, i) => (
                    <li key={o.id} className='flex items-center gap-2'>
                        <span className='size-3 shrink-0 rounded-full' style={{ background: optionColor(i, options.length) }} />
                        <span className='min-w-0 flex-1 break-words'>{o.label}</span>
                        <span className='shrink-0 text-sm text-ink-500 tabular-nums'>{formatOptionNumbers(o, numbers)}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
