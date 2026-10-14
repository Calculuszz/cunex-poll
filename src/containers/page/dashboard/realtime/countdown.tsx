'use client'
import React, { useSyncExternalStore } from 'react'
import { Clock } from 'lucide-react'
import { formatCountdown } from '@/lib/thaiDate'

// เช็คทุกวินาที แต่ snapshot เป็นเลขนาที React จึง re-render เฉพาะตอนขึ้นนาทีใหม่
// ฝั่ง server คืน null เพราะเวลาของ server กับเครื่องผู้ใช้ไม่ตรงกัน แสดงหลัง hydrate แทน
function subscribeMinute(callback: () => void) {
    const id = setInterval(callback, 1000)
    return () => clearInterval(id)
}
const useMinute = () => useSyncExternalStore(subscribeMinute, () => Math.floor(Date.now() / 60_000), () => null)

export function Countdown({ closeAt, closed }: { closeAt: string; closed: boolean }) {
    const minute = useMinute()
    const text = closed ? null : minute === null ? '' : formatCountdown(closeAt, new Date(minute * 60_000))
    return (
        <p className='flex items-center gap-1.5 text-ink-500'>
            <Clock className='size-4 shrink-0' />
            {/* จองความสูงบรรทัดไว้ก่อน hydrate กันหน้าขยับ */}
            <span className='min-h-6'>{text === null ? 'ปิดโหวตแล้ว' : text}</span>
        </p>
    )
}
