'use client'
import React from 'react'
import { Columns2, Rows3, type LucideIcon } from 'lucide-react'
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
        label: '1 คอลัมน์',
        description: 'เรียงลงมาทีละข้อเต็มความกว้าง ตัวเลือกที่มีรูปแสดงรูป 1:1 เหนือข้อความ',
        icon: Rows3,
    },
    {
        value: 'grid',
        label: '2 คอลัมน์',
        description: 'วางคู่กันแถวละ 2 ตัวเลือก รูป 1:1 ข้อความเป็นคำบรรยายใต้รูป',
        icon: Columns2,
    },
]

// ตัวเลือกที่ยังไม่มีรูป: โหมด 2 คอลัมน์ต้องมีรูปทุกตัวเลือก ไม่งั้นกริดพังเป็นช่องว่าง (System flow §5)
export const missingImageCount = (options: { imageUrl?: string }[]) => options.filter((o) => !o.imageUrl).length

// missingImages > 0 = สลับเป็น 2 คอลัมน์ไม่ได้จนกว่าจะใส่รูปครบ
// ถ้าเป็น 2 คอลัมน์อยู่แล้วแต่รูปหายไป (เพิ่มตัวเลือกใหม่/ลบรูป) เตือนไว้ และการส่งขออนุมัติจะถูกบล็อก
export function OptionLayoutSelect({
    id,
    value,
    onChange,
    missingImages = 0,
}: {
    id: string
    value: OptionLayout
    onChange: (next: OptionLayout) => void
    missingImages?: number
}) {
    const current = OPTION_LAYOUTS.find((o) => o.value === value) ?? OPTION_LAYOUTS[0]
    const gridBlocked = missingImages > 0

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
                            <SelectItem
                                key={value}
                                value={value}
                                disabled={value === 'grid' && gridBlocked}
                                className='text-base flex *:items-center'
                            >
                                <Icon />
                                {label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
            <span className='text-sm text-ink-500'>{current.description}</span>
            {gridBlocked && (
                <span role={value === 'grid' ? 'alert' : undefined} className={value === 'grid' ? 'text-sm text-destructive' : 'text-sm text-ink-500'}>
                    {value === 'grid'
                        ? `ยังมี ${missingImages} ตัวเลือกที่ไม่มีรูป ใส่รูปให้ครบก่อนส่งขออนุมัติ หรือเปลี่ยนเป็น 1 คอลัมน์`
                        : 'ใช้ 2 คอลัมน์ได้เมื่อใส่รูปครบทุกตัวเลือก'}
                </span>
            )}
        </div>
    )
}
