import { create } from "zustand";

// id ของฉบับร่างที่กำลังแก้อยู่ในหน้า create: null = สร้างโพลใหม่ ไม่ persist เพราะต้องไม่ค้างข้ามการใช้งาน
// hydratedId = ฉบับร่างที่โหลดลงฟอร์มไปแล้ว ไม่ล้างตอนออกจากหน้า เพื่อให้กลับมาจากหน้าดูตัวอย่างแล้วไม่โหลดจาก DB ทับของที่แก้ค้างไว้
type UseCreateDraftStore = {
    draftId: string | null
    hydratedId: string | null
    setDraftId: (id: string | null) => void
    setHydratedId: (id: string | null) => void
}

export const useCreateDraftStore = create<UseCreateDraftStore>()((set) => ({
    draftId: null,
    hydratedId: null,
    setDraftId: (draftId) => set({ draftId }),
    setHydratedId: (hydratedId) => set({ hydratedId }),
}))
