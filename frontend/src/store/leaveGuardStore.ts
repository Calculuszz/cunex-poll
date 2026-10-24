import { create } from "zustand";

// ปลายทางที่รอการยืนยันก่อนออกจากหน้า create (path ที่จะไป)
export type LeaveTarget = string

type UseLeaveGuardStore = {
    target: LeaveTarget | null
    request: (target: LeaveTarget) => void
    close: () => void
}

// อยู่ใน store เพราะ dialog อยู่ที่ navbar แต่ปุ่มที่ทำให้ออกอยู่ที่ไหนก็ได้ (ปุ่มย้อนกลับ, เมนู profile)
export const useLeaveGuardStore = create<UseLeaveGuardStore>()((set) => ({
    target: null,
    request: (target) => set({ target }),
    close: () => set({ target: null }),
}))
