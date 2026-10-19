import { create } from "zustand";

// ฉบับร่างที่กำลังแก้อยู่ในหน้า create: draftId null = สร้างโพลใหม่ · version ใช้ส่ง If-Match ตอนบันทึกทับ
// ไม่ persist เพราะต้องไม่ค้างข้ามการใช้งาน
// hydratedId = ฉบับร่างที่โหลดลงฟอร์มไปแล้ว ไม่ล้างตอนออกจากหน้า เพื่อให้กลับมาจากหน้าดูตัวอย่างแล้วไม่โหลดจาก server ทับของที่แก้ค้างไว้
type UseCreateDraftStore = {
    draftId: string | null
    version: number | null
    hydratedId: string | null
    setDraft: (id: string | null, version: number | null) => void
    setHydratedId: (id: string | null) => void
}

export const useCreateDraftStore = create<UseCreateDraftStore>()((set) => ({
    draftId: null,
    version: null,
    hydratedId: null,
    setDraft: (draftId, version) => set({ draftId, version }),
    setHydratedId: (hydratedId) => set({ hydratedId }),
}))
