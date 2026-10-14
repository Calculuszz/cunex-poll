import type { ReactNode } from 'react'

// หน้ากรอกโพลใช้แถบบนของตัวเอง (VoterHeader) ไม่ใช้ navbar ของหน้าเจ้าของโพล
// ออกแบบที่มือถือ ~390px จอใหญ่จำกัดความกว้างไว้ให้อ่านง่าย
export default function VoteLayout({ children }: { children: ReactNode }) {
    return <div className='mx-auto flex min-h-svh w-full max-w-xl flex-col px-4'>{children}</div>
}
