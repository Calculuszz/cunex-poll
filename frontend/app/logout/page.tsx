'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { api } from '@/api'
import { useVoteFlowStore } from '@/store/voteFlowStore'
import { resetCreateForm } from '@/containers/page/create/draftActions'

// ออกจากระบบ (POST /auth/logout) แล้วล้างข้อมูลในเครื่องของบัญชีนี้ (ร่างโพล/คำตอบที่ค้างในหน่วยความจำ) ก่อนไปหน้า login
// เป็นหน้าแยกเพื่อให้ dialog "ออกจากหน้าสร้างโพล" ดักก่อนได้เหมือนลิงก์อื่น
export default function LogoutPage() {
    const router = useRouter()
    useEffect(() => {
        api.auth.logout().catch(() => {}).finally(() => {
            resetCreateForm()
            useVoteFlowStore.getState().reset()
            router.replace('/login')
            router.refresh()
        })
    }, [router])
    return (
        <div className='flex h-svh items-center justify-center gap-2 text-ink-500'>
            <Loader2 className='animate-spin' />
            กำลังออกจากระบบ...
        </div>
    )
}
