import { create } from "zustand";

export type CreateStep = 1 | 2

type UseCreateStepStore = {
    step: CreateStep
    setStep: (step: CreateStep) => void
}

// อยู่ใน store เพราะปุ่มย้อนกลับบน navbar อยู่นอกหน้า create แต่ต้องรู้ว่าตอนนี้อยู่ step ไหน
export const useCreateStepStore = create<UseCreateStepStore>()((set) => ({
    step: 1,
    setStep: (step) => set({ step }),
}))
