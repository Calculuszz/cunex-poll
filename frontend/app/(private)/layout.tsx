import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getMe } from '@/api/server'
import { AdminLayout } from '@/containers/layout/admin'

// หน้าแอดมินทั้งกลุ่ม: ไม่ใช่แอดมินกลับหน้าแรก (API ตอบ 403 อยู่แล้ว ตรงนี้กันไม่ให้เห็นหน้าเปล่า)
export default async function Layout({ children }: { children: ReactNode }) {
    const me = await getMe()
    if (!me) redirect('/login?returnTo=/admin')
    if (me.role !== 'admin') redirect('/')
    return <AdminLayout>{children}</AdminLayout>
}
