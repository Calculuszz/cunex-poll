import React from 'react'
import { formatOptionNumbers, type DisplayNumbers, type DisplayOption } from '@/lib/resultDisplay'
import { optionColor } from '@/lib/resultView'

const GRIDLINES = [0.25, 0.5, 0.75, 1]

// แผนภูมิแท่งแนวตั้ง ความสูงเทียบกับตัวเลือกที่ได้มากสุด
// แท่งใช้ scaleY และป้ายตัวเลขเลื่อนด้วย translateY ให้ขยับตามยอดแท่งโดยไม่แตะ layout
// ตัวเลือกเยอะจะเลื่อนแนวนอนในการ์ดเอง แต่ละแท่งกว้างอย่างน้อย 64px
export function ResultBarView({ options, numbers }: { options: DisplayOption[]; numbers: DisplayNumbers }) {
    return (
        <div className='rounded-xl border p-3'>
            <div className='thin-scrollbar overflow-x-auto pb-2'>
                <div className='flex min-w-full w-max'>
                    {options.map((o, i) => {
                        const ratio = o.weight
                        return (
                            <div key={o.id} className='flex min-w-16 flex-1 flex-col'>
                                {/* pt-6 เว้นที่ให้ป้ายตัวเลขของแท่งที่สูงสุดไม่ล้นขอบบน */}
                                <div className='relative h-48 border-b border-ink-400 pt-6'>
                                    <div className='relative h-full'>
                                        {GRIDLINES.map((g) => (
                                            <div key={g} className='absolute inset-x-0 border-t border-border' style={{ bottom: `${g * 100}%` }} />
                                        ))}
                                        <div
                                            className='absolute inset-x-2 bottom-0 h-full origin-bottom rounded-t-md transition-transform duration-300 ease-out'
                                            style={{ background: optionColor(i, options.length), transform: `scaleY(${ratio})` }}
                                        />
                                        <div
                                            className='absolute inset-x-0 top-0 h-full transition-transform duration-300 ease-out'
                                            style={{ transform: `translateY(${(1 - ratio) * 100}%)` }}
                                        >
                                            <span className='absolute inset-x-0 bottom-full pb-1 text-center text-xs text-ink-500 whitespace-nowrap tabular-nums'>
                                                {formatOptionNumbers(o, numbers)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span title={o.label} className='truncate px-1 pt-1.5 text-center text-sm'>{o.label}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
