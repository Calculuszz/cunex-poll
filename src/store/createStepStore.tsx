import { create } from "zustand";

export type CreateStep = 1 | 2

type UseCreateStepStore = {
    step: CreateStep
    // ขั้นที่จะกลับไปเมื่อเปิดหน้า create ครั้งถัดไป (หน้าดูตัวอย่างตั้งเป็น 2 ให้กลับมาที่ขั้นคำถาม)
    resumeStep: CreateStep | null
    setStep: (step: CreateStep) => void
    setResumeStep: (step: CreateStep | null) => void
}

// อยู่ใน store เพราะปุ่มย้อนกลับบน navbar อยู่นอกหน้า create แต่ต้องรู้ว่าตอนนี้อยู่ step ไหน
export const useCreateStepStore = create<UseCreateStepStore>()((set) => ({
    step: 1,
    resumeStep: null,
    setStep: (step) => set({ step }),
    setResumeStep: (resumeStep) => set({ resumeStep }),
}))
