import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware"
import type { AudienceRule, AudienceType } from "@/api/types"

type PollFormFields = {
    title: string
    desc: string
    // เก็บเป็น ISO string เพราะ persist เป็น JSON ไม่รองรับ Date · openTime null = เปิดทันทีที่กด Publish
    openTime: string | null
    closeTime: string | null
    // publicUrl จาก POST /images/uploads
    coverImageUrl: string | null
    // chula = ทั้งจุฬาฯ · restricted = เฉพาะคณะ/ปีเข้า · public = สาธารณะ (ทุกคนที่ล็อกอิน)
    audienceType: AudienceType
    // กฎของ restricted: studentYear null = ทุกปีเข้า
    rules: AudienceRule[]
    realtime: boolean
    allowAnswerEdit: boolean
    listedPublicly: boolean
}

export type CreatePollState = PollFormFields

type UseCreatePollStore = PollFormFields & {
    update: (patch: Partial<PollFormFields>) => void
    reset: () => void
}

const INITIAL_FIELDS: PollFormFields = {
    title: "",
    desc: "",
    openTime: null,
    closeTime: null,
    coverImageUrl: null,
    audienceType: "chula",
    rules: [],
    realtime: false,
    allowAnswerEdit: true,
    listedPublicly: true,
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
            // v2: เปลี่ยนตามสัญญา API v1 (scope A/B/C/D → audienceType) · v4: ตัดช่องที่ backend ไม่มี (รหัส/ลงคะแนนซ้ำ/ระบุคนส่ง)
            version: 4,
            migrate: (persisted, version) => {
                if (version >= 2) {
                    const p = persisted as Partial<PollFormFields> & { audienceType?: string }
                    const fields = Object.fromEntries(Object.keys(INITIAL_FIELDS).map((k) => [k, p[k as keyof PollFormFields]]).filter(([, v]) => v !== undefined))
                    const merged = { ...INITIAL_FIELDS, ...fields } as PollFormFields
                    return (merged.audienceType as string) === 'codes' ? { ...merged, audienceType: 'chula' } : merged
                }
                const old = persisted as { title?: string; desc?: string; closeTime?: string | null; scope?: string; realtime?: boolean; showExplore?: boolean }
                return {
                    ...INITIAL_FIELDS,
                    title: old.title ?? '',
                    desc: old.desc ?? '',
                    closeTime: old.closeTime ?? null,
                    audienceType: old.scope === 'C' ? 'public' : old.scope === 'B' ? 'restricted' : 'chula',
                    realtime: old.realtime ?? false,
                    listedPublicly: old.showExplore ?? true,
                }
            },
        }
    )
)
