'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Info, Loader2, FlaskConical } from "lucide-react"
import { toast } from 'sonner'
import { api, authUrls, errorMessage } from '@/api'
import { Card } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ล็อกอินด้วย CUNEX ทางเดียว (ปิด Google แล้ว) เป็นการเปลี่ยนหน้าไปที่ backend แล้วกลับมาที่ returnTo
// บัญชีทดสอบ (POST /auth/dev/login) โชว์เฉพาะตอนไม่ใช่ production
const SHOW_DEV_LOGIN = process.env.NODE_ENV !== 'production'

export function CardLogin({ returnTo, error }: { returnTo: string; error: string | null }) {
    const router = useRouter()
    const [devPending, setDevPending] = useState<'user' | 'admin' | null>(null)

    const devLogin = async (role: 'user' | 'admin') => {
        setDevPending(role)
        try {
            await api.auth.devLogin(role)
            router.replace(returnTo)
            router.refresh()
        } catch (err) {
            toast.error(errorMessage(err, 'เข้าสู่ระบบไม่สำเร็จ'))
            setDevPending(null)
        }
    }

    return (
        <Card className='w-100 mx-6 flex items-center justify-center shadow-lg container'>
            <section className='w-full px-6'>
                <p className='font-heading text-2xl font-bold text-center pb-3 pt-1'>เลือกวิธีเข้าสู่ระบบ</p>
                <hr className=' border-ink-400' />
            </section>
            {error && <p role='alert' className='mx-6 mt-4 rounded-lg bg-red-100 px-3 py-2 text-center text-red-200'>{error}</p>}
            <section className='w-full flex px-10 *:w-full flex-col gap-3 py-6'>
                <a href={authUrls.cunex(returnTo)} className={cn(buttonVariants({ size: 'lg' }), 'py-6! font-heading font-bold text-lg text-center relative')}>
                    <ShieldCheck className='size-5 absolute top-1/2 -translate-y-1/2 left-4'/>
                    เข้าสู่ระบบด้วย CUNEX
                </a>
                {SHOW_DEV_LOGIN && (
                    <div className='flex flex-col gap-2 rounded-xl border border-dashed p-3'>
                        <span className='flex items-center gap-1 text-sm font-bold text-ink-500'><FlaskConical className='size-4' />บัญชีทดสอบ (ไม่มีใน production)</span>
                        <div className='flex gap-2'>
                            {(['user', 'admin'] as const).map((role) => (
                                <Button key={role} variant='outline' className='flex-1' disabled={devPending !== null} onClick={() => devLogin(role)}>
                                    {devPending === role && <Loader2 className='animate-spin' />}
                                    {role === 'user' ? 'ผู้ใช้ทั่วไป' : 'แอดมิน'}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </section>
            <section className=' w-full flex gap-1 px-4 items-center'>
                <Info size={16}/>
                ระบบจะไม่แสดงชื่อผู้ตอบให้เจ้าของโพลเห็น
            </section>
        </Card>
    )
}
