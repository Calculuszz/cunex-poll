import React from 'react'
import { Eye, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

// บอกผู้ตอบว่าเจ้าของโพลเห็นตัวตนไหม (System flow §8) ใช้ซ้ำในหน้าแรกของโพลและ dialog ยืนยันส่ง
// identified = โพลเปิด "ระบุคนส่ง" เจ้าของเห็นรหัสคู่กับคำตอบ ต้องบอกชัดก่อนเริ่มตอบ
export function AnonymityNote({ identified = false, className }: { identified?: boolean; className?: string }) {
    if (identified) {
        return (
            <p className={cn('flex items-center justify-center gap-1.5 text-center text-sm font-bold text-yellow-700', className)}>
                <Eye className='size-4 shrink-0' />
                โพลนี้ระบุคนส่ง เจ้าของโพลจะเห็นรหัสของคุณคู่กับคำตอบ
            </p>
        )
    }
    return (
        <p className={cn('flex items-center justify-center gap-1.5 text-sm text-ink-500', className)}>
            <Info className='size-4 shrink-0' />
            ระบบจะไม่แสดงชื่อผู้ตอบให้เจ้าของโพลเห็น
        </p>
    )
}
