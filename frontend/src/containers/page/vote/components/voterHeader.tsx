'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import AvatarPopup from '@/containers/widgets/components/avator-popup'
import { isVoteDirty } from '@/store/voteFlowStore'
import { UnsavedChangesModal } from './unsavedChangesModal'

// แถบบนของหน้ากรอกโพล: ลิงก์ย้อนกลับ (ข้อความเปลี่ยนตามหน้า) + avatar
// guardPollId = อยู่ในหน้าคำถาม ถ้ามีคำตอบที่ยังไม่ได้บันทึกต้องถามก่อนออก
export function VoterHeader({ link, guardPollId }: { link?: { href: string; label: string }; guardPollId?: string }) {
    const router = useRouter()
    const [confirmOpen, setConfirmOpen] = useState(false)

    return (
        <header className='sticky top-0 z-30 -mx-4 mb-4 flex h-16 items-center justify-between border-b bg-background px-4'>
            {link ? (
                <Link
                    href={link.href}
                    onClick={(e) => {
                        if (guardPollId && isVoteDirty()) {
                            e.preventDefault()
                            setConfirmOpen(true)
                        }
                    }}
                    className='flex items-center gap-1 rounded-sm font-bold text-primary underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
                >
                    <ArrowLeft className='size-4' />
                    {link.label}
                </Link>
            ) : <span />}
            <AvatarPopup />
            {guardPollId && link && (
                <UnsavedChangesModal
                    pollId={guardPollId}
                    open={confirmOpen}
                    onOpenChange={setConfirmOpen}
                    onLeave={() => router.push(link.href)}
                />
            )}
        </header>
    )
}
