'use client'
import React, { useState } from 'react'
import { Square, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useDebouncedField } from '@/hooks/useDebouncedField'
import { blankOption } from '@/lib/createFormItem'
import { useElementStore, type InputItem } from '@/store/elementStore'
import { OptionLayoutSelect } from './optionLayout'
import { OptionRow, useOptionCommit } from './optionRow'

export type CheckboxInputItem = Extract<InputItem, { type: 'checkbox' }>

const MIN_OPTIONS = 2

export function CheckboxInput({ item }: { item: CheckboxInputItem }) {
    const update = useElementStore((s) => s.update)
    const commitOption = useOptionCommit(item.id)
    const [focusId, setFocusId] = useState<string | null>(null)

    const [label, setLabel] = useDebouncedField(
        item.label,
        (next) => update(item.id, { label: next }),
    )

    const layout = item.optionLayout ?? 'list'
    const canRemoveOption = item.options.length > MIN_OPTIONS

    const addOption = () => {
        const option = blankOption()
        update(item.id, { options: [...item.options, option] })
        setFocusId(option.id)
    }

    const removeOption = (optionId: string) => {
        if (!canRemoveOption) return
        update(item.id, { options: item.options.filter((o) => o.id !== optionId) })
    }

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

            <div className='flex flex-col gap-2'>
                <Label className='text-base font-bold'>ตัวเลือก</Label>

                <div className='flex flex-col gap-3'>
                    {item.options.map((option, index) => (
                        <OptionRow
                            key={option.id}
                            option={option}
                            index={index}
                            icon={Square}
                            layout={layout}
                            autoFocus={option.id === focusId}
                            canRemove={canRemoveOption}
                            onCommit={commitOption}
                            onRemove={removeOption}
                            onEnter={addOption}
                        />
                    ))}
                </div>

                <Button
                    type='button'
                    variant='outline'
                    className='w-full justify-center gap-2 rounded-input border-badge text-base font-bold text-ink-700'
                    onClick={addOption}
                >
                    <Plus />
                    <span>เพิ่มตัวเลือก</span>
                </Button>

                <span className='text-sm text-ink-500'>
                    ผู้โหวตเลือกได้หลายข้อจากรายการนี้ ต้องมีอย่างน้อย {MIN_OPTIONS} ตัวเลือก
                </span>
            </div>

            <OptionLayoutSelect
                id={`${item.id}-layout`}
                value={layout}
                onChange={(next) => update(item.id, { optionLayout: next })}
            />

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
