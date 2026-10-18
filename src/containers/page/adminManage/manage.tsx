import React from 'react'
import { getMe, getServerApi, loadOrNotFound } from '@/api/server'
import { AdminCard } from './components/adminCard'
import { AddAdminDialog } from './components/addAdminDialog'

// รายชื่อแอดมิน (GET /admin/admins) ผู้ใช้ปัจจุบันขึ้นก่อน
export async function AdminManagePage() {
    const api = await getServerApi()
    const [admins, me] = await loadOrNotFound(() => Promise.all([api.admin.admins(), getMe()]), '/admin/manage')
    const sorted = [...admins].sort((a, b) => Number(b.id === me?.id) - Number(a.id === me?.id))

    return (
        <div className='flex flex-col gap-4 pb-24'>
            <div className='flex items-end gap-2'>
                <h1 className='font-heading text-4xl font-bold'>จัดการผู้ดูแลระบบ</h1>
            </div>
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {sorted.map((admin) => (
                    <AdminCard key={admin.id} admin={admin} isCurrentUser={admin.id === me?.id} />
                ))}
            </div>
            {admins.length === 1 && <p className='text-base text-ink-500'>ยังไม่มีแอดมินคนอื่น กดปุ่มเพิ่ม admin เพื่อเพิ่มได้เลย</p>}
            <AddAdminDialog />
        </div>
    )
}
