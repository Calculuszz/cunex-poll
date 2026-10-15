import React from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navBtn = cn(buttonVariants({ variant: 'outline' }), 'rounded-full px-4 font-heading text-base font-bold')

// ตัวเปลี่ยนหน้าแบบลิงก์ (?page=n) ใช้ใน server component ได้ ไม่แสดงเมื่อมีหน้าเดียว
export function PageNav({ page, totalPages, hrefOf }: { page: number; totalPages: number; hrefOf: (page: number) => string }) {
    if (totalPages <= 1) return null
    return (
        <nav aria-label='เปลี่ยนหน้า' className='flex items-center justify-center gap-3 pt-4'>
            {page > 1
                ? <Link href={hrefOf(page - 1)} className={navBtn}><ChevronLeft />ก่อนหน้า</Link>
                : <span aria-disabled className={cn(navBtn, 'pointer-events-none opacity-50')}><ChevronLeft />ก่อนหน้า</span>}
            <span className='text-base text-ink-500 tabular-nums'>หน้า {page} จาก {totalPages}</span>
            {page < totalPages
                ? <Link href={hrefOf(page + 1)} className={navBtn}>ถัดไป<ChevronRight /></Link>
                : <span aria-disabled className={cn(navBtn, 'pointer-events-none opacity-50')}>ถัดไป<ChevronRight /></span>}
        </nav>
    )
}
