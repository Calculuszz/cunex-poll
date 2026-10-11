import { create } from "zustand";

// id ของฉบับร่างที่กำลังแก้อยู่ในหน้า create: null = สร้างโพลใหม่ ไม่ persist เพราะต้องไม่ค้างข้ามการใช้งาน
type UseCreateDraftStore = {
    draftId: string | null
    setDraftId: (id: string | null) => void
}

export const useCreateDraftStore = create<UseCreateDraftStore>()((set) => ({
    draftId: null,
    setDraftId: (draftId) => set({ draftId }),
}))
