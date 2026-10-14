'use client'
import { useState } from 'react'
import { useVoteFlowStore } from '@/store/voteFlowStore'

export type SaveResult = { ok: true } | { ok: false; error: string; code?: string }

// บันทึกฉบับร่างของคำตอบปัจจุบันขึ้น server
// keepalive ใช้ตอนกำลังออกจากหน้า (ปุ่มย้อนกลับของเบราว์เซอร์) ให้คำขอไปถึงแม้หน้าถูกปิดไปแล้ว
export async function saveVoteDraft(pollId: string, options?: { keepalive?: boolean }): Promise<SaveResult> {
    const { answers, markSaved } = useVoteFlowStore.getState()
    try {
        const res = await fetch(`/api/polls/${pollId}/my-response`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers }),
            keepalive: options?.keepalive,
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) return { ok: false, error: data?.error ?? 'บันทึกคำตอบไม่สำเร็จ', code: data?.code }
        markSaved(data.lastSavedAt, answers)
        return { ok: true }
    } catch {
        return { ok: false, error: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ คำตอบยังอยู่ ลองใหม่อีกครั้ง' }
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
