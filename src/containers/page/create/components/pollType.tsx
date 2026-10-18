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
import { Textarea } from '@/components/ui/textarea'
import type { AudienceType, CodeKind } from '@/api/types'
import { CODE_KIND_LABEL, CODE_LENGTH, CODE_PATTERNS, parseCodes } from '@/lib/codes'
import { AUDIENCE_DESCRIPTION, AUDIENCE_LABEL } from '@/lib/pollLabels'
import { useShallow } from 'zustand/react/shallow'
import { useCreatePollStore } from '@/store/createPollStore'
import { FacultyPicker } from './facultyPicker'
import { PresetTools } from './presetTools'

const CODE_KIND_ITEMS = [
  { label: "นิสิต (10 หลัก)", value: "STUDENT" },
  { label: "บุคลากร (8 หลัก)", value: "STAFF" },
]

const items: { label: string; value: AudienceType }[] = [
  { label: AUDIENCE_LABEL.chula, value: "chula" },
  { label: AUDIENCE_LABEL.restricted, value: "restricted" },
  { label: AUDIENCE_LABEL.public, value: "public" },
  { label: AUDIENCE_LABEL.codes, value: "codes" },
]

// ขอบเขตผู้ตอบ: ทั้งจุฬาฯ / เฉพาะคณะ-สาขา-ปีเข้า / สาธารณะ / กำหนดจากรหัส
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
            {audienceType === 'codes' && <CodeListInput />}
        </div>
    )
}

function CodeListInput() {
    const text = useCreatePollStore((s) => s.codesText)
    const codeKind = useCreatePollStore((s) => s.codeKind)
    const update = useCreatePollStore((s) => s.update)
    const lines = parseCodes(text)
    const invalid = lines.filter((line) => !CODE_PATTERNS[codeKind].test(line))
    const label = CODE_KIND_LABEL[codeKind]
    const length = CODE_LENGTH[codeKind]
    const placeholder = codeKind === 'STUDENT'
        ? '6400000001\n6400000002\n6400000003'
        : '12345678\n23456789\n34567890'

    return (
        <div className='flex flex-col gap-2 mt-2'>
            <div className='flex flex-col gap-1'>
                <Label className='font-bold text-base'>ประเภทรหัส</Label>
                <Select items={CODE_KIND_ITEMS} value={codeKind} onValueChange={(v) => v && update({ codeKind: v as CodeKind })}>
                    <SelectTrigger className='w-full text-base h-10!'>
                        <SelectValue placeholder='เลือกประเภทรหัส' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {CODE_KIND_ITEMS.map((item) => (
                                <SelectItem className='text-base' key={item.value} value={item.value}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <Label className='font-bold text-base'>รายการรหัส{label}</Label>
            <Textarea
                value={text}
                onChange={(e) => update({ codesText: e.target.value })}
                placeholder={placeholder}
                rows={6}
            />
            <span className='text-sm text-ink-500'>
                ใส่รหัส {length} หลักหนึ่งรหัสต่อหนึ่งบรรทัด · {lines.length} รหัส
                {invalid.length > 0 && <span className='text-destructive'> · ไม่ถูกรูปแบบ {invalid.length} รายการ</span>}
            </span>
            <PresetTools />
        </div>
    )
}


// สวิตช์ตั้งค่าโพล · โพลสาธารณะล็อกลงคะแนนซ้ำไว้ที่เปิดและระบุคนส่งไว้ที่ปิด · ลงคะแนนซ้ำแล้ว "แก้คำตอบ" ไม่มีความหมาย
export function PollTypeMore() {
    // useShallow: selector คืน object ใหม่ทุกครั้ง ต้องเทียบแบบตื้นไม่งั้นวน render
    const f = useCreatePollStore(useShallow((s) => ({
        audienceType: s.audienceType, realtime: s.realtime, allowAnswerEdit: s.allowAnswerEdit,
        allowRepeat: s.allowRepeat, listedPublicly: s.listedPublicly, identifySender: s.identifySender,
    })))
    const update = useCreatePollStore((s) => s.update)
    const isPublic = f.audienceType === 'public'
    const repeat = isPublic || f.allowRepeat

    const rows: { key: 'realtime' | 'allowRepeat' | 'allowAnswerEdit' | 'listedPublicly' | 'identifySender'; label: string; checked: boolean; disabled?: boolean; hint: string }[] = [
        { key: 'realtime', label: 'แสดงผลแบบเรียลไทม์', checked: f.realtime, hint: 'ผู้ที่ตอบแล้วดูผลระหว่างเปิดโหวตได้ (เปลี่ยนได้จนกว่าจะเปิดโหวต)' },
        {
            key: 'allowRepeat', label: 'ลงคะแนนซ้ำ', checked: repeat, disabled: isPublic,
            hint: isPublic ? 'โพลสาธารณะเปิดให้ลงคะแนนซ้ำเสมอ' : 'ส่งได้หลายครั้ง นับทุกครั้งที่ส่ง',
        },
        {
            key: 'allowAnswerEdit', label: 'แก้คำตอบได้', checked: !repeat && f.allowAnswerEdit, disabled: repeat,
            hint: repeat ? 'ใช้ไม่ได้เมื่อเปิดลงคะแนนซ้ำ' : 'หนึ่งคนหนึ่งคำตอบ แต่กลับมาแก้คำตอบของตัวเองได้จนกว่าจะปิดโหวต',
        },
        { key: 'listedPublicly', label: 'แสดงในหน้ารวมโพล', checked: f.listedPublicly, hint: 'ปิดไว้ = เข้าได้ทางลิงก์หรือ QR เท่านั้น' },
        {
            key: 'identifySender', label: 'ระบุคนส่ง', checked: !isPublic && f.identifySender, disabled: isPublic,
            hint: isPublic ? 'โพลสาธารณะไม่ระบุคนส่ง' : 'เปิดแล้วคุณจะเห็นรหัสของผู้ตอบคู่กับคำตอบ เช่น ใช้ทำแบบทดสอบ ผู้ตอบจะได้รับแจ้งก่อนเริ่มตอบ',
        },
    ]

    return (
        <div className='flex flex-col gap-2 py-2'>
            {rows.map((r) => (
                <div key={r.key} className='flex flex-col'>
                    <div className="flex gap-1 items-center">
                        <Switch id={`poll-${r.key}`} checked={r.checked} disabled={r.disabled} onCheckedChange={(v) => update({ [r.key]: v })} />
                        <Label htmlFor={`poll-${r.key}`} className=' text-base font-bold font-heading'>{r.label}</Label>
                    </div>
                    <span className='text-sm text-ink-500'>{r.hint}</span>
                </div>
            ))}
        </div>
    )
}
