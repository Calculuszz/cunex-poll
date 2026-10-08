import React from 'react'

/** ตัวแบ่งหน้าไม่มีค่าให้กรอก หน้าที่ของการ์ดนี้คือบอกให้เห็นว่าเส้นแบ่งอยู่ตรงไหนและหน้าถัดไปคือหน้าที่เท่าไหร่ */
export function PageBreakElement({ page, isEmptyPage }: { page: number; isEmptyPage: boolean }) {
    return (
        <div className='flex flex-col gap-2'>
            <div className='flex items-center gap-2'>
                <span className='grow border-t border-dashed border-ink-400' aria-hidden />
                <span className='text-base font-bold text-ink-700'>เริ่มหน้าที่ {page}</span>
                <span className='grow border-t border-dashed border-ink-400' aria-hidden />
            </div>
            <span className='text-sm text-ink-500'>
                {isEmptyPage
                    ? `หน้าที่ ${page} ยังว่างอยู่ เพิ่มคำถามหรือองค์ประกอบต่อจากการ์ดนี้ หรือลบตัวแบ่งหน้านี้ออก`
                    : `รายการที่อยู่ถัดจากการ์ดนี้จะแสดงในหน้าที่ ${page} ของโพล`}
            </span>
        </div>
    )
}
