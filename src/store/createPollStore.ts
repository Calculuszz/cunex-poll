import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware"
import type { AudienceRule, AudienceType, CodeKind } from "@/api/types"

type PollFormFields = {
    title: string
    desc: string
    // เก็บเป็น ISO string เพราะ persist เป็น JSON ไม่รองรับ Date
    closeTime: string | null
    // publicUrl จาก POST /images/uploads
    coverImageUrl: string | null
    // chula = ทั้งจุฬาฯ · restricted = เฉพาะคณะ/สาขา/ปีเข้า · public = สาธารณะ (ทุกคนที่ล็อกอิน รวม Google) · codes = กำหนดจากรหัส
    audienceType: AudienceType
    // กฎของ restricted: departmentCode null = ทั้งคณะ · studentYear null = ทุกปีเข้า
    rules: AudienceRule[]
    // ประเภทของรหัสในแบบ "กำหนดจากรหัส": นิสิต 10 หลัก หรือบุคลากร 8 หลัก
    codeKind: CodeKind
    // รหัสทีละบรรทัดในแบบ "กำหนดจากรหัส"
    codesText: string
    realtime: boolean
    allowAnswerEdit: boolean
    // ลงคะแนนซ้ำได้ (นับทุกครั้งที่ส่ง) · โพลสาธารณะเปิดเสมอ
    allowRepeat: boolean
    listedPublicly: boolean
    // เจ้าของโพลเห็นรหัสผู้ตอบ (เช่นใช้ทำแบบทดสอบ) · โพลสาธารณะใช้ไม่ได้
    identifySender: boolean
}

export type { CodeKind } from "@/api/types"

export type CreatePollState = PollFormFields

type UseCreatePollStore = PollFormFields & {
    update: (patch: Partial<PollFormFields>) => void
    reset: () => void
}

const INITIAL_FIELDS: PollFormFields = {
    title: "",
    desc: "",
    closeTime: null,
    coverImageUrl: null,
    audienceType: "chula",
    rules: [],
    codeKind: "STUDENT",
    codesText: "",
    realtime: false,
    allowAnswerEdit: true,
    allowRepeat: false,
    listedPublicly: true,
    identifySender: false,
}

// อยู่ใน store และ persist ไว้ ร่างที่ยังไม่ได้กดบันทึกจะได้ไม่หายตอนรีเฟรช
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
            // v2: เปลี่ยนตามสัญญา API v1 (scope A/B/C/D → audienceType) · v3: เติมช่องรหัส/ลงคะแนนซ้ำ/ระบุคนส่งกลับมา
            version: 3,
            migrate: (persisted, version) => {
                if (version === 2) return { ...INITIAL_FIELDS, ...(persisted as Partial<PollFormFields>) }
                if (version >= 3) return persisted as PollFormFields
                const old = persisted as { title?: string; desc?: string; closeTime?: string | null; scope?: string; realtime?: boolean; showExplore?: boolean }
                return {
                    ...INITIAL_FIELDS,
                    title: old.title ?? '',
                    desc: old.desc ?? '',
                    closeTime: old.closeTime ?? null,
                    audienceType: old.scope === 'C' ? 'public' : old.scope === 'B' ? 'restricted' : old.scope === 'D' ? 'codes' : 'chula',
                    realtime: old.realtime ?? false,
                    listedPublicly: old.showExplore ?? true,
                }
            },
        }
    )
)
