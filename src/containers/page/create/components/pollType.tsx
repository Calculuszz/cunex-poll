'use client'
import React, { useState } from 'react'
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
import { FacultyPicker } from './facultyPicker'

export type PollScope = "A" | "B" | "C" | "D"

const items = [
  { label: "ทั้งจุฬา ฯ", value: "A" },
  { label: "เฉพาะคณะ/สาขา", value: "B" },
  { label: "สาธารณะ", value: "C" },
  { label: "กำหนดจากรหัส", value: "D" },
]

// รูปแบบรหัสนิสิตจุฬาฯ: 10 หลักตัวเลข
const CODE_PATTERN = /^\d{10}$/

export function PollType({ value, onValueChange }: { value: PollScope; onValueChange: (value: PollScope) => void }) {
    return (
        <div className='flex flex-col gap-1'>
            <Label className="text-xl font-heading font-bold">ประเภทโพล</Label>
            <Select items={items} value={value} onValueChange={(v) => v && onValueChange(v as PollScope)}>
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
            {value === 'B' && <FacultyPicker />}
            {value === 'D' && <CodeListInput />}
        </div>
    )
}

function CodeListInput() {
    const [text, setText] = useState('')
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
    const invalid = lines.filter((line) => !CODE_PATTERN.test(line))

    return (
        <div className='flex flex-col gap-1 mt-2'>
            <Label className='font-bold text-base'>รายการรหัสนิสิต</Label>
            <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={'6400000001\n6400000002\n6400000003'}
                rows={6}
            />
            <span className='text-sm text-ink-500'>
                ใส่รหัส 10 หลักหนึ่งรหัสต่อหนึ่งบรรทัด · {lines.length} รหัส
                {invalid.length > 0 && <span className='text-destructive'> · ไม่ถูกรูปแบบ {invalid.length} รายการ</span>}
            </span>
        </div>
    )
}


export function PollTypeMore({ pollType }: { pollType: PollScope }) {
    // โพลสาธารณะล็อกสวิตช์ลงคะแนนซ้ำไว้ที่เปิด และกดเปลี่ยนไม่ได้
    const isPublic = pollType === 'C'
    const [allowAgain, setAllowAgain] = useState(false)
    // โพลสาธารณะล็อกสวิตช์ระบุคนส่งไว้ที่ปิด
    const [sender, setSender] = useState(false)

    return (
        <div className='flex flex-col gap-1 py-2'>
            <div className="flex gap-1 items-center">
                <Switch id='poll-realtime' />
                <Label htmlFor='poll-realtime' className=' text-base font-bold font-heading'>แสดงผลแบบเรียลไทม์</Label>
            </div>
            <div className="flex gap-1 items-center">
                <Switch id='poll-again' checked={isPublic || allowAgain} onCheckedChange={setAllowAgain} disabled={isPublic} />
                <Label htmlFor='poll-again' className=' text-base font-bold font-heading'>ลงคะแนนซ้ำ</Label>
            </div>
            {isPublic && <span className='text-sm text-ink-500'>โพลสาธารณะเปิดให้ลงคะแนนซ้ำเสมอ</span>}
            <div className="flex gap-1 items-center">
                <Switch id='poll-explore' />
                <Label htmlFor='poll-explore' className=' text-base font-bold font-heading'>เพิ่มลงหน้า explore</Label>
            </div>
            <div className="flex gap-1 items-center">
                <Switch id='poll-sender' checked={!isPublic && sender} onCheckedChange={setSender} disabled={isPublic} />
                <Label htmlFor='poll-sender' className=' text-base font-bold font-heading'>ระบุคนส่ง</Label>
            </div>
            {isPublic && <span className='text-sm text-ink-500'>โพลสาธารณะไม่ระบุคนส่ง</span>}
        </div>
    )
}
