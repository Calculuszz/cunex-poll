'use client'
import { useState } from 'react'
import { api, errorMessage } from '@/api'
import { answersToApi } from '@/lib/voteForm'
import { useVoteFlowStore } from '@/store/voteFlowStore'

export type SaveResult = { ok: true } | { ok: false; error: string; code?: string }

// บันทึกฉบับร่างของคำตอบปัจจุบันขึ้น server (PUT /polls/:id/ballot/draft [เสนอเพิ่ม])
// keepalive ใช้ตอนกำลังออกจากหน้า (ปุ่มย้อนกลับของเบราว์เซอร์) ให้คำขอไปถึงแม้หน้าถูกปิดไปแล้ว
export async function saveVoteDraft(pollId: string, options?: { keepalive?: boolean }): Promise<SaveResult> {
    const { answers, textKeys, markSaved } = useVoteFlowStore.getState()
    try {
        const draft = await api.ballot.putDraft(pollId, answersToApi(answers, textKeys), options)
        markSaved(draft.savedAt, answers)
        return { ok: true }
    } catch (err) {
        return { ok: false, error: errorMessage(err, 'บันทึกคำตอบไม่สำเร็จ คำตอบยังอยู่ ลองใหม่อีกครั้ง') }
    }
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
