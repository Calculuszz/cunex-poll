'use client'
import React from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { AudienceType } from '@/api/types'
import { AUDIENCE_DESCRIPTION, AUDIENCE_LABEL } from '@/lib/pollLabels'
import { useShallow } from 'zustand/react/shallow'
import { useCreatePollStore } from '@/store/createPollStore'
import { FacultyPicker } from './facultyPicker'

const items: { label: string; value: AudienceType }[] = [
  { label: AUDIENCE_LABEL.chula, value: "chula" },
  { label: AUDIENCE_LABEL.restricted, value: "restricted" },
  { label: AUDIENCE_LABEL.public, value: "public" },
]

// ขอบเขตผู้ตอบ: ทั้งจุฬาฯ / เฉพาะคณะ-ปีเข้า / สาธารณะ
export function PollType() {
    const audienceType = useCreatePollStore((s) => s.audienceType)
    const update = useCreatePollStore((s) => s.update)

    return (
        <div className='flex flex-col gap-1'>
            <Label className="text-xl font-heading font-bold">ประเภทโพล</Label>
            <Select items={items} value={audienceType} onValueChange={(v) => v && update({ audienceType: v as AudienceType })}>
                <SelectTrigger className="w-full text-base h-10!">
                    <SelectValue placeholder="เลือกประเภทโพล" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                    <SelectLabel>เลือกประเภทโพล</SelectLabel>
                    {items.map((item) => (
                        <SelectItem className={`text-base `} key={item.value} value={item.value}>
                        {item.label}
                        </SelectItem>
                    ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
            <span className='text-sm text-ink-500'>{AUDIENCE_DESCRIPTION[audienceType]}</span>
            {audienceType === 'restricted' && <FacultyPicker />}
        </div>
    )
}

// สวิตช์ตั้งค่าโพล
export function PollTypeMore() {
    // useShallow: selector คืน object ใหม่ทุกครั้ง ต้องเทียบแบบตื้นไม่งั้นวน render
    const f = useCreatePollStore(useShallow((s) => ({
        realtime: s.realtime, allowAnswerEdit: s.allowAnswerEdit, listedPublicly: s.listedPublicly,
    })))
    const update = useCreatePollStore((s) => s.update)

    const rows: { key: 'realtime' | 'allowAnswerEdit' | 'listedPublicly'; label: string; checked: boolean; hint: string }[] = [
        { key: 'realtime', label: 'แสดงผลแบบเรียลไทม์', checked: f.realtime, hint: 'ผู้ที่ตอบแล้วดูผลระหว่างเปิดโหวตได้ (เปลี่ยนได้จนกว่าจะเปิดโหวต)' },
        { key: 'allowAnswerEdit', label: 'แก้คำตอบได้', checked: f.allowAnswerEdit, hint: 'หนึ่งคนหนึ่งคำตอบ แต่กลับมาแก้คำตอบของตัวเองได้จนกว่าจะปิดโหวต' },
        { key: 'listedPublicly', label: 'แสดงในหน้ารวมโพล', checked: f.listedPublicly, hint: 'ปิดไว้ = เข้าได้ทางลิงก์หรือ QR เท่านั้น' },
    ]

    return (
        <div className='flex flex-col gap-2 py-2'>
            {rows.map((r) => (
                <div key={r.key} className='flex flex-col'>
                    <div className="flex gap-1 items-center">
                        <Switch id={`poll-${r.key}`} checked={r.checked} onCheckedChange={(v) => update({ [r.key]: v })} />
                        <Label htmlFor={`poll-${r.key}`} className=' text-base font-bold font-heading'>{r.label}</Label>
                    </div>
                    <span className='text-sm text-ink-500'>{r.hint}</span>
                </div>
            ))}
        </div>
    )
}
