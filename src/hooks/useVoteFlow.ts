'use client'
import { useState } from 'react'
import { answersToApi } from '@/lib/voteForm'
import { writeDraft } from '@/lib/voteDraft'
import { useVoteFlowStore } from '@/store/voteFlowStore'

export type SaveResult = { ok: true } | { ok: false; error: string; code?: string }

// บันทึกฉบับร่างของคำตอบปัจจุบันไว้ในเบราว์เซอร์ (ดู src/lib/voteDraft.ts)
export async function saveVoteDraft(pollId: string): Promise<SaveResult> {
    const { answers, textKeys, markSaved } = useVoteFlowStore.getState()
    const draft = writeDraft(pollId, answersToApi(answers, textKeys))
    markSaved(draft.savedAt, answers)
    return { ok: true }
}

// สถานะกำลังบันทึก สำหรับปุ่มที่ต้องรอบันทึกก่อนเปลี่ยนหน้า
export function useSaveDraft(pollId: string) {
    const [saving, setSaving] = useState(false)
    const save = async () => {
        setSaving(true)
        const result = await saveVoteDraft(pollId)
        setSaving(false)
        return result
    }
    return { saving, save }
}
