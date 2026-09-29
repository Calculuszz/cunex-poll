'use client'
import React from 'react'
import { Card } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { ShieldCheck, Mail, Info } from "lucide-react"
import { useRouter } from 'next/navigation'

export function CardLogin() {
    const router = useRouter();
    return (
        <Card className='w-100 mx-6 flex items-center justify-center shadow-lg container'>
            <section className='w-full px-6'>
                <p className='font-heading text-2xl font-bold text-center pb-3 pt-1'>เลือกวิธีเข้าสู่ระบบ</p>
                <hr className=' border-ink-400' />
            </section>
            <section className='w-full flex px-10 *:w-full flex-col gap-3 py-6'>
                <Button onClick={() => router.push("/")} size={'lg'} className={`py-6! font-heading font-bold text-lg text-center relative`}>
                    <ShieldCheck className='size-5 absolute top-1/2 -translate-y-1/2 left-4'/>
                    <h1>เข้าสู่ระบบด้วย CUNEX</h1>
                </Button>
                <Button variant={`outline`} size={'lg'} className={`py-6! font-heading text-base relative text-ink-700 border-border-light`}>
                    <ShieldCheck className='size-5 absolute top-1/2 -translate-y-1/2 left-4 text-muted'/>
                    <h1>เข้าสู่ระบบด้วย Google</h1>
                </Button>
                <Button size={'lg'} variant={`outline`} className={`py-6! font-heading text-base relative text-ink-700 border-border-light`}>
                    <Mail className='size-5 absolute top-1/2 -translate-y-1/2 left-4 text-muted'/>
                    <h1>เข้าสู่ระบบด้วย Email</h1>
                </Button>
            </section>
            <section className=' w-full flex gap-1 px-4 items-center'>
                <Info size={16}/>
                ระบบจะไม่แสดงชื่อผู้ตอบให้เจ้าของโพลเห็น
            </section>
        </Card>
    )
}
