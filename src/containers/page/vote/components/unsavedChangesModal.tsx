'use client'
import React, { useState } from 'react'
import { FileX, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { saveVoteDraft } from '@/hooks/useVoteFlow'
import { useVoteFlowStore } from '@/store/voteFlowStore'

// ถามก่อนออกจากหน้าคำถามเมื่อยังมีคำตอบที่ไม่ได้บันทึก หน้าตาแบบเดียวกับ dialog ยืนยันอื่นในระบบ
// ไม่บันทึก = ย้อนคำตอบกลับไปเท่าฉบับร่างล่าสุดแล้วออก · กากบาท/Esc = อยู่หน้าเดิม
export function UnsavedChangesModal({ pollId, open, onOpenChange, onLeave }: {
    pollId: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onLeave: () => void
}) {
    const revert = useVoteFlowStore((s) => s.revert)
    const [saving, setSaving] = useState(false)

    const saveAndLeave = async () => {
        setSaving(true)
        const result = await saveVoteDraft(pollId)
        setSaving(false)
        if (!result.ok) {
            toast.error(result.error)
            return
        }
        onOpenChange(false)
        onLeave()
    }

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!saving) onOpenChange(next) }}>
            <DialogContent>
                <div className='flex w-full flex-col items-center pt-4'>
                    <FileX className='size-14 text-primary' />
                    <DialogTitle className='py-6 font-heading text-xl font-bold'>ยังไม่ได้บันทึกการเปลี่ยนแปลง</DialogTitle>
                    <DialogDescription className='text-center text-base'>
                        ข้อมูลที่คุณแก้ไขยังไม่ได้บันทึก<br />หากออกจากหน้านี้โดยไม่บันทึก ข้อมูลจะหายไป
                    </DialogDescription>
                    <div className='flex w-full gap-2 py-4'>
                        <Button
                            variant='outline'
                            className='flex-1 rounded-full font-heading text-base font-bold'
                            disabled={saving}
                            onClick={() => { revert(); onOpenChange(false); onLeave() }}
                        >
                            ไม่บันทึก
                        </Button>
                        <Button className='flex-1 rounded-full font-heading text-base font-bold' disabled={saving} aria-busy={saving} onClick={saveAndLeave}>
                            {saving && <Loader2 className='animate-spin' />}
                            บันทึกและออก
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
