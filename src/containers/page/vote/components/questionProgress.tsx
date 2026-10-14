import React from 'react'

// แถบความคืบหน้าตามหน้า (แบ่งหน้าด้วย pagebreak) ใช้ scaleX ไม่แตะ layout และหยุดขยับเมื่อผู้ใช้ตั้งลดการเคลื่อนไหว
export function QuestionProgress({ page, total }: { page: number; total: number }) {
    return (
        <div className='flex flex-col gap-1.5'>
            <span className='text-sm text-ink-500'>หน้าที่ {page} จาก {total}</span>
            <div
                role='progressbar'
                aria-valuemin={1}
                aria-valuemax={total}
                aria-valuenow={page}
                aria-label='ความคืบหน้า'
                className='h-1.5 overflow-hidden rounded-full bg-inner-bg'
            >
                <div
                    className='h-full origin-left rounded-full bg-primary transition-transform duration-300 ease-out motion-reduce:transition-none'
                    style={{ transform: `scaleX(${page / total})` }}
                />
            </div>
        </div>
    )
}
