import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware"

export type PollScope = "A" | "B" | "C" | "D"

type PollFormFields = {
    title: string
    desc: string
    // เก็บเป็น ISO string เพราะ persist เป็น JSON ไม่รองรับ Date
    closeTime: string | null
    scope: PollScope
    realtime: boolean
    allowRepeat: boolean
    showExplore: boolean
    identifySender: boolean
    // id ของคณะ/สาขาที่เลือกในประเภท "เฉพาะคณะ/สาขา"
    audienceIds: string[]
    // ประเภทของรหัสในประเภท "กำหนดจากรหัส": นิสิต 10 หลัก หรือบุคลากร 8 หลัก
    codeKind: CodeKind
    // รหัสทีละบรรทัดในประเภท "กำหนดจากรหัส"
    codesText: string
}

export type CodeKind = "STUDENT" | "STAFF"

export type CreatePollState = PollFormFields

type UseCreatePollStore = PollFormFields & {
    update: (patch: Partial<PollFormFields>) => void
    reset: () => void
}

const INITIAL_FIELDS: PollFormFields = {
    title: "",
    desc: "",
    closeTime: null,
    scope: "A",
    realtime: false,
    allowRepeat: false,
    showExplore: false,
    identifySender: false,
    audienceIds: [],
    codeKind: "STUDENT",
    codesText: "",
}

// อยู่ใน store และ persist ไว้ เพื่อให้ "บันทึก draft" เก็บข้อมูลโพลได้ ไม่ใช่แค่คำถาม
export const useCreatePollStore = create<UseCreatePollStore>()(
    persist(
        (set) => ({
            ...INITIAL_FIELDS,
            update: (patch) => set(patch),
            reset: () => set(INITIAL_FIELDS),
        }),
        {
            name: 'poll-form-draft',
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => {
                const fields: Partial<UseCreatePollStore> = {}
                for (const key of Object.keys(INITIAL_FIELDS) as (keyof PollFormFields)[]) {
                    Object.assign(fields, { [key]: s[key] })
                }
                return fields
            },
            version: 1,
        }
    )
)
