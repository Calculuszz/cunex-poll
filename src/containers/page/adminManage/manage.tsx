import React from 'react'
import Link from 'next/link'
import { AdminCard } from './components/adminCard'
import { AddAdminDialog } from './components/addAdminDialog'
import { getAdmins } from '@/lib/admins'

export async function AdminManagePage() {
    const admins = await getAdmins()

    return (
        <div className='flex flex-col gap-4 pb-24'>
            <div className='flex items-end gap-2'>
                <h1 className='font-heading text-4xl font-bold'>จัดการผู้ดูแลระบบ</h1>
            </div>
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {admins.map((admin) => (
                    <AdminCard key={admin.studentId} studentId={admin.studentId} isCurrentUser={admin.isCurrentUser} />
                ))}
            </div>
            {admins.length === 1 && <p className='text-base text-ink-500'>ยังไม่มีแอดมินคนอื่น กดปุ่มเพิ่ม admin เพื่อเพิ่มได้เลย</p>}
            <AddAdminDialog />
        </div>
    )
}
