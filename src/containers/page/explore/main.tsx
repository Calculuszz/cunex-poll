import React from 'react'
import { getServerApi, loadOrNotFound } from '@/api/server'
import { ExploreFeed } from './exploreFeed'

const PAGE_SIZE = 12

// หน้ารวมโพล (GET /polls): โพลที่เจ้าของเปิด "แสดงในหน้ารวมโพล" และผู้ใช้มีสิทธิ์ตอบ backend กรองให้แล้ว
// โหลดหน้าแรกของทั้งสองแท็บที่ server หน้าถัดไปโหลดเพิ่มฝั่ง client ด้วย cursor
export async function ExplorePage() {
    const api = await getServerApi()
    const [open, closed] = await loadOrNotFound(
        () => Promise.all([api.polls.feed({ status: 'open', limit: PAGE_SIZE }), api.polls.feed({ status: 'closed', limit: PAGE_SIZE })]),
        '/explore',
    )
    return (
        <div className=' relative flex flex-col gap-2 pb-8'>
            <h1 className=' text-4xl font-bold font-heading'>โพลที่กรอกได้</h1>
            <ExploreFeed initial={{ open, closed }} pageSize={PAGE_SIZE} />
        </div>
    )
}
