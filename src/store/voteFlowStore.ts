import { create } from 'zustand'
import type { AnswerValue, Answers } from '@/lib/voteForm'

// คำตอบที่กำลังกรอกของโพลหนึ่งใบ อยู่ในหน่วยความจำระหว่างเปลี่ยนหน้าคำถาม
// saved = สำเนาที่ตรงกับฉบับร่างบน server ล่าสุด ใช้บอกว่ามีอะไรยังไม่ได้บันทึก (dirty)
type VoteFlowStore = {
    pollId: string | null
    answers: Answers
    saved: Answers
    lastSavedAt: string | null
    init: (pollId: string, answers: Answers, lastSavedAt: string | null) => void
    setAnswer: (key: string, value: AnswerValue | undefined) => void
    markSaved: (lastSavedAt: string, answers: Answers) => void
    revert: () => void
    reset: () => void
}

export const useVoteFlowStore = create<VoteFlowStore>()((set) => ({
    pollId: null,
    answers: {},
    saved: {},
    lastSavedAt: null,
    init: (pollId, answers, lastSavedAt) => set({ pollId, answers, saved: answers, lastSavedAt }),
    setAnswer: (key, value) => set((s) => {
        const answers = { ...s.answers }
        if (value === undefined) delete answers[key]
        else answers[key] = value
        return { answers }
    }),
    markSaved: (lastSavedAt, answers) => set({ lastSavedAt, saved: answers }),
    revert: () => set((s) => ({ answers: s.saved })),
    reset: () => set({ pollId: null, answers: {}, saved: {}, lastSavedAt: null }),
}))

const sameAnswers = (a: Answers, b: Answers) => JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b))
const sortKeys = (a: Answers) => Object.keys(a).sort().map((k) => [k, a[k]])

export const useVoteDirty = () => useVoteFlowStore((s) => !sameAnswers(s.answers, s.saved))
export const isVoteDirty = () => {
    const s = useVoteFlowStore.getState()
    return !sameAnswers(s.answers, s.saved)
}
