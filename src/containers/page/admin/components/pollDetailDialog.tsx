'use client'
import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import type { PollDetail } from '@/lib/polls'
import { SCOPE_LABEL, STATUS_LABEL, formatCloseTime } from '@/lib/pollLabels'
import { MOCK_FACULTIES } from '@/containers/page/create/components/mockFaculty'
import { CODE_KIND_LABEL } from '@/containers/page/create/components/buildPayload'

// ข้อมูลจาก API ส่ง closeTime มาเป็น string จึงต้องแปลงก่อนใช้
export type PollDetailJson = Omit<PollDetail, 'closeTime'> & { closeTime: string }

const DEPARTMENT_LABEL = new Map(
    MOCK_FACULTIES.flatMap((f) => f.departments.map((d) => [d.value, `${f.label} · ${d.label}`] as const)),
)
const FACULTY_LABEL = new Map(MOCK_FACULTIES.map((f) => [f.value, f.label] as const))

const YES_NO = (value: boolean) => (value ? 'ใช่' : 'ไม่')

export function PollDetailDialog({ open, onOpenChange, detail, error, loading }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    detail: PollDetailJson | null
    error: string | null
    loading: boolean
}) {
    const questions = detail?.items.filter((item) => item.data.kind === 'input') ?? []
    const elementCount = (detail?.items.length ?? 0) - questions.length

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-lg'>
                <DialogHeader>
                    <DialogTitle className='font-heading font-bold text-xl'>
                        {detail?.title ?? 'รายละเอียดโพล'}
                    </DialogTitle>
                    <DialogDescription className='text-base'>
                        {loading && 'กำลังโหลดข้อมูล...'}
                        {error && <span className='text-destructive'>{error}</span>}
                        {detail && (detail.desc || 'ไม่มีคำอธิบาย')}
                    </DialogDescription>
                </DialogHeader>

                {detail && (
                    <div className='flex flex-col gap-3 text-base'>
                        <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-1'>
                            <dt className='text-ink-500'>สถานะ</dt>
                            <dd>{STATUS_LABEL[detail.type]}</dd>
                            <dt className='text-ink-500'>ประเภท</dt>
                            <dd>{SCOPE_LABEL[detail.scope]}</dd>
                            <dt className='text-ink-500'>ปิดโหวต</dt>
                            <dd>{formatCloseTime(new Date(detail.closeTime))}</dd>
                            <dt className='text-ink-500'>เรียลไทม์</dt>
                            <dd>{YES_NO(detail.realtime)}</dd>
                            <dt className='text-ink-500'>ลงคะแนนซ้ำ</dt>
                            <dd>{YES_NO(detail.allowRepeat)}</dd>
                            <dt className='text-ink-500'>หน้า explore</dt>
                            <dd>{YES_NO(detail.showExplore)}</dd>
                            <dt className='text-ink-500'>ระบุคนส่ง</dt>
                            <dd>{YES_NO(detail.identifySender)}</dd>
                        </dl>

                        <section className='flex flex-col gap-1'>
                            <h3 className='font-heading font-bold text-lg'>กลุ่มผู้ตอบ</h3>
                            {detail.scope === 'A' && <p>ทั้งจุฬา ฯ</p>}
                            {detail.scope === 'C' && <p>สาธารณะ</p>}
                            {detail.scope === 'B' && (
                                <ul className='list-disc pl-5'>
                                    {detail.audience.faculties.map((id) => (
                                        <li key={id}>{FACULTY_LABEL.get(id) ?? id} (ทั้งคณะ)</li>
                                    ))}
                                    {detail.audience.departments.map((id) => (
                                        <li key={id}>{DEPARTMENT_LABEL.get(id) ?? id}</li>
                                    ))}
                                </ul>
                            )}
                            {detail.scope === 'D' && (
                                <p className='break-all'>
                                    รหัส{CODE_KIND_LABEL[detail.audience.codeKind ?? 'STUDENT']} {detail.audience.studentCodes.length} รหัส: {detail.audience.studentCodes.join(', ')}
                                </p>
                            )}
                        </section>

                        <section className='flex flex-col gap-1'>
                            <h3 className='font-heading font-bold text-lg'>
                                คำถาม {questions.length} ข้อ{elementCount > 0 && ` · องค์ประกอบ ${elementCount} รายการ`}
                            </h3>
                            <ol className='list-decimal pl-5'>
                                {questions.map((item) => (
                                    <li key={item.position}>{String(item.data.label ?? 'ไม่มีชื่อ')}</li>
                                ))}
                            </ol>
                        </section>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
