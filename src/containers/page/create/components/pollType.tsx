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

const items = [
  { label: "ทั้งจุฬา ฯ", value: "A" },
  { label: "เฉพาะคณะ/สาขา", value: "B" },
  { label: "สาธารณะ", value: "C" },
]

export function PollType() {
    return (
        <div className='flex flex-col gap-1'>
            <Label className="text-xl font-heading font-bold">ประเภทโพล</Label>
            <Select items={items}>
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
        </div>
    )
}


export function PollTypeMore() {
    return (
        <div className='flex flex-col gap-1 py-2'>
            <div className="flex gap-1 items-center">
                <Switch id='poll-realtime' />
                <Label htmlFor='poll-realtime' className=' text-base font-bold font-heading'>แสดงผลแบบเรียลไทม์</Label>
            </div>
            <div className="flex gap-1 items-center">
                <Switch id='poll-again' />
                <Label htmlFor='poll-again' className=' text-base font-bold font-heading'>ลงคะแนนซ้ำ</Label>
            </div>
            <div className="flex gap-1 items-center">
                <Switch id='poll-explore' />
                <Label htmlFor='poll-explore' className=' text-base font-bold font-heading'>เพิ่มลงหน้า explore</Label>
            </div>
        </div>
    )
}
