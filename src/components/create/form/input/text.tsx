'use client'
import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useDebouncedField } from '@/hooks/useDebouncedField'
import { useElementStore, type InputItem } from '@/store/elementStore'

export type TextInputItem = Extract<InputItem, { type: 'text' }>
export function TextInput({ item }: { item: TextInputItem }) {
    const update = useElementStore((s) => s.update)

    const [label, setLabel] = useDebouncedField(
        item.label,
        (next) => update(item.id, { label: next }),
    )
    const [placeholder, setPlaceholder] = useDebouncedField(
        item.placeholder ?? '',
        (next) => update(item.id, { placeholder: next }),
    )

    return (
        <>
            <div className='flex flex-col gap-1'>
                <Label htmlFor={`${item.id}-label`} className='text-base font-bold'>
                    คำถาม
                </Label>
                <Input
                    id={`${item.id}-label`}
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder='พิมพ์คำถาม...'
                />
            </div>

            <div className='flex flex-col gap-1'>
                <Label htmlFor={`${item.id}-placeholder`} className='text-base font-bold'>
                    ข้อความตัวอย่างในช่องคำตอบ
                </Label>
                <Input
                    id={`${item.id}-placeholder`}
                    value={placeholder}
                    onChange={(e) => setPlaceholder(e.target.value)}
                    placeholder='เช่น พิมพ์คำตอบของคุณที่นี่...'
                />
                <span className='text-sm text-ink-500'>ข้อความจางที่แสดงในช่องก่อนผู้โหวตพิมพ์คำตอบ</span>
            </div>

            <div className='flex items-center gap-2'>
                <Switch
                    id={`${item.id}-required`}
                    checked={item.required}
                    onCheckedChange={(checked) => update(item.id, { required: checked })}
                />
                <Label htmlFor={`${item.id}-required`} className='font-heading text-base font-bold'>
                    จำเป็นต้องตอบ
                </Label>
            </div>
        </>
    )
}
