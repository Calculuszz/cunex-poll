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
import { useCreatePollStore, type CodeKind, type PollScope } from '@/store/createPollStore'
import { FacultyPicker } from './facultyPicker'
import { CODE_KIND_LABEL, CODE_LENGTH, CODE_PATTERNS, parseCodes } from './buildPayload'
import { PresetTools } from './presetTools'

const CODE_KIND_ITEMS = [
  { label: "นิสิต (10 หลัก)", value: "STUDENT" },
  { label: "บุคลากร (8 หลัก)", value: "STAFF" },
]

export type { PollScope } from '@/store/createPollStore'

const items = [
  { label: "ทั้งจุฬา ฯ", value: "A" },
  { label: "เฉพาะคณะ/สาขา", value: "B" },
  { label: "สาธารณะ", value: "C" },
  { label: "กำหนดจากรหัส", value: "D" },
]

export function PollType() {
    const scope = useCreatePollStore((s) => s.scope)
    const update = useCreatePollStore((s) => s.update)

    return (
        <div className='flex flex-col gap-1'>
            <Label className="text-xl font-heading font-bold">ประเภทโพล</Label>
            <Select items={items} value={scope} onValueChange={(v) => v && update({ scope: v as PollScope })}>
                <SelectTrigger className="w-full text-base h-10!">
                    <SelectValue placeholder="เลือกประเภทโพล" />
                </SelectTrigger>
                <SelectContent className={``}>
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
            {scope === 'B' && <FacultyPicker />}
            {scope === 'D' && <CodeListInput />}
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


export function PollTypeMore() {
    const scope = useCreatePollStore((s) => s.scope)
    const realtime = useCreatePollStore((s) => s.realtime)
    const allowRepeat = useCreatePollStore((s) => s.allowRepeat)
    const showExplore = useCreatePollStore((s) => s.showExplore)
    const identifySender = useCreatePollStore((s) => s.identifySender)
    const update = useCreatePollStore((s) => s.update)
    // โพลสาธารณะล็อกสวิตช์ลงคะแนนซ้ำไว้ที่เปิด และล็อกระบุคนส่งไว้ที่ปิด
    const isPublic = scope === 'C'

    return (
        <div className='flex flex-col gap-1 py-2'>
            <div className="flex gap-1 items-center">
                <Switch id='poll-realtime' checked={realtime} onCheckedChange={(v) => update({ realtime: v })} />
                <Label htmlFor='poll-realtime' className=' text-base font-bold font-heading'>แสดงผลแบบเรียลไทม์</Label>
            </div>
            <div className="flex gap-1 items-center">
                <Switch id='poll-again' checked={isPublic || allowRepeat} onCheckedChange={(v) => update({ allowRepeat: v })} disabled={isPublic} />
                <Label htmlFor='poll-again' className=' text-base font-bold font-heading'>ลงคะแนนซ้ำ</Label>
            </div>
            {isPublic && <span className='text-sm text-ink-500'>โพลสาธารณะเปิดให้ลงคะแนนซ้ำเสมอ</span>}
            <div className="flex gap-1 items-center">
                <Switch id='poll-explore' checked={showExplore} onCheckedChange={(v) => update({ showExplore: v })} />
                <Label htmlFor='poll-explore' className=' text-base font-bold font-heading'>เพิ่มลงหน้า explore</Label>
            </div>
            <div className="flex gap-1 items-center">
                <Switch id='poll-sender' checked={!isPublic && identifySender} onCheckedChange={(v) => update({ identifySender: v })} disabled={isPublic} />
                <Label htmlFor='poll-sender' className=' text-base font-bold font-heading'>ระบุคนส่ง</Label>
            </div>
            {isPublic && <span className='text-sm text-ink-500'>โพลสาธารณะไม่ระบุคนส่ง</span>}
        </div>
    )
}
