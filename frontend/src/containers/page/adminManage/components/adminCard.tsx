'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { formatThaiDateTime } from '@/lib/thaiDate'
import { api, errorMessage } from '@/api'
import type { AdminUser } from '@/api/types'

// การ์ดแอดมิน: ผู้ใช้ปัจจุบันแสดงเป็นการ์ดแรกและถอนสิทธิ์ตัวเองไม่ได้
// การถอนสิทธิ์ต้องยืนยันใน dialog ก่อนเรียก API เสมอ
export function AdminCard({ admin, isCurrentUser }: { admin: AdminUser; isCurrentUser: boolean }) {
    const studentId = admin.studentId ?? '-'
    const router = useRouter()
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleConfirmChange = (next: boolean) => {
        if (busy) return
        setConfirmOpen(next)
        if (!next) setError(null)
    }

    const revoke = async () => {
        setBusy(true)
        setError(null)
        try {
            await api.admin.removeAdmin(admin.id)
            setConfirmOpen(false)
            router.refresh()
        } catch (err) {
            setError(errorMessage(err, 'ถอนสิทธิ์ไม่สำเร็จ'))
        } finally {
            setBusy(false)
        }
    }

    return (
        <Card size='sm'>
            <CardContent className='flex items-center justify-between gap-2'>
                <div className='flex min-w-0 flex-col'>
                    <span className='truncate font-heading text-lg font-bold'>รหัส {studentId}</span>
                    <span className='text-base text-ink-500'>
                        {admin.lastLoginAt ? `เข้าระบบล่าสุด ${formatThaiDateTime(admin.lastLoginAt)}` : 'ยังไม่เคยเข้าระบบ'}
                    </span>
                </div>
                {isCurrentUser ? (
                    <span className='shrink-0 rounded-md bg-secondary px-2 py-0.5 text-sm font-bold'>คุณ</span>
                ) : (
                    <Button variant='link' className='shrink-0 text-base font-bold text-destructive' onClick={() => setConfirmOpen(true)}>
                        ถอนสิทธิ์
                    </Button>
                )}
            </CardContent>
            {!isCurrentUser && (
                <Dialog open={confirmOpen} onOpenChange={handleConfirmChange}>
                    <DialogContent>
                        <div className='flex w-full flex-col items-center pt-4'>
                            <UserMinus className='size-14 text-destructive' />
                            <span className='py-6 font-heading text-xl font-bold'>ยืนยันการถอนสิทธิ์ ?</span>
                            <span className='text-center text-base'>
                                รหัส {studentId} จะไม่สามารถเข้าหน้าผู้ดูแลระบบได้อีก<br />จนกว่าจะได้รับสิทธิ์แอดมินอีกครั้ง
                            </span>
                            <div className='flex w-full gap-2 py-4'>
                                <Button variant='outline' className='flex-1 font-heading text-base font-bold' disabled={busy} onClick={() => handleConfirmChange(false)}>
                                    ยกเลิก
                                </Button>
                                <Button variant='destructive' className='flex-1' disabled={busy} aria-busy={busy} onClick={revoke}>
                                    {busy ? <Loader2 className='animate-spin' /> : <UserMinus />}
                                    <span className='font-heading text-base font-bold'>ถอนสิทธิ์</span>
                                </Button>
                            </div>
                        </div>
                        {error && <p role='alert' className='text-base text-destructive'>{error}</p>}
                    </DialogContent>
                </Dialog>
            )}
        </Card>
    )
}
