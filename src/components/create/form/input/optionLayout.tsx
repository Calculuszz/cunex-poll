'use client'
import React from 'react'
import { Grid2x2, List, type LucideIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export type OptionLayout = 'list' | 'grid'

/** ป้ายกับคำอธิบายอยู่ที่เดียว เพราะทั้ง trigger, รายการใน dropdown และคำอธิบายใต้ช่อง ต้องพูดตรงกัน */
export const OPTION_LAYOUTS: {
    value: OptionLayout
    label: string
    description: string
    icon: LucideIcon
}[] = [
    {
        value: 'list',
        label: 'แบบรายการ',
        description: 'เรียงลงมาทีละข้อ รูปกับข้อความมีน้ำหนักเท่ากัน',
        icon: List,
    },
    {
        value: 'grid',
        label: 'แบบรูปใหญ่',
        description: 'เน้นรูปเป็นหลัก รูปใหญ่เด่นกว่าข้อความ ข้อความเป็นคำบรรยายใต้รูป',
        icon: Grid2x2,
    },
]

export function OptionLayoutSelect({
    id,
    value,
    onChange,
}: {
    id: string
    value: OptionLayout
    onChange: (next: OptionLayout) => void
}) {
    const current = OPTION_LAYOUTS.find((o) => o.value === value) ?? OPTION_LAYOUTS[0]

    return (
        <div className='flex flex-col gap-1'>
            <Label htmlFor={id} className='text-base font-bold'>
                รูปแบบการแสดงตัวเลือก
            </Label>
            <Select
                items={OPTION_LAYOUTS.map(({ value, label }) => ({ value, label }))}
                value={value}
                onValueChange={(next) => onChange(next as OptionLayout)}
            >
                <SelectTrigger id={id} className='h-10! w-full text-base'>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {OPTION_LAYOUTS.map(({ value, label, icon: Icon }) => (
                            <SelectItem key={value} value={value} className='text-base flex *:items-center'>
                                <Icon />
                                {label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
            <span className='text-sm text-ink-500'>{current.description}</span>
        </div>
    )
}
