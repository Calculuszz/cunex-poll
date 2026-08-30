'use client'
import React, { useState } from 'react'
import { Circle, Plus, Trash2, List, Grid2x2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useDebouncedField } from '@/hooks/useDebouncedField'
import { blankOption } from '@/lib/createFormItem'
import { useElementStore, type InputItem, type Option } from '@/store/elementStore'

export type RadioInputItem = Extract<InputItem, { type: 'radio' }>

const MIN_OPTIONS = 2

export function RadioInput({ item }: { item: RadioInputItem }) {
    const update = useElementStore((s) => s.update)
    const [focusId, setFocusId] = useState<string | null>(null)

    const [label, setLabel] = useDebouncedField(
        item.label,
        (next) => update(item.id, { label: next }),
    )

    const layout = item.optionLayout ?? 'list'
    const canRemoveOption = item.options.length > MIN_OPTIONS


    const commitOptionLabel = (optionId: string, next: string) => {
        const current = useElementStore.getState().items.find((i) => i.id === item.id)
        if (!current || !('options' in current)) return
        if (!current.options.some((o) => o.id === optionId)) return
        update(item.id, {
            options: current.options.map((o) => (o.id === optionId ? { ...o, label: next } : o)),
        })
    }

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
                <div className='flex items-center justify-between gap-2'>
                    <Label className='text-base font-bold'>ตัวเลือก</Label>
                    <div className='flex items-center gap-1'>
                        <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            aria-label='เรียงตัวเลือกลงเป็นรายการ'
                            aria-pressed={layout === 'list'}
                            className={layout === 'list'
                                ? 'bg-secondary text-ink-900'
                                : 'bg-transparent text-ink-500 hover:bg-secondary hover:text-ink-900'}
                            onClick={() => update(item.id, { optionLayout: 'list' })}
                        >
                            <List />
                        </Button>
                        <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            aria-label='เรียงตัวเลือกเป็นตาราง 2 คอลัมน์'
                            aria-pressed={layout === 'grid'}
                            className={layout === 'grid'
                                ? 'bg-secondary text-ink-900'
                                : 'bg-transparent text-ink-500 hover:bg-secondary hover:text-ink-900'}
                            onClick={() => update(item.id, { optionLayout: 'grid' })}
                        >
                            <Grid2x2 />
                        </Button>
                    </div>
                </div>

                <div className='flex flex-col gap-2'>
                    {item.options.map((option, index) => (
                        <OptionRow
                            key={option.id}
                            option={option}
                            index={index}
                            autoFocus={option.id === focusId}
                            canRemove={canRemoveOption}
                            onCommit={commitOptionLabel}
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
                    ผู้โหวตเลือกได้ข้อเดียวจากรายการนี้ ต้องมีอย่างน้อย {MIN_OPTIONS} ตัวเลือก
                    {layout === 'grid' ? ' แสดงผลเป็นตาราง 2 คอลัมน์' : ''}
                </span>
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

function OptionRow({
    option,
    index,
    autoFocus,
    canRemove,
    onCommit,
    onRemove,
    onEnter,
}: {
    option: Option
    index: number
    autoFocus: boolean
    canRemove: boolean
    onCommit: (optionId: string, next: string) => void
    onRemove: (optionId: string) => void
    onEnter: () => void
}) {
    const [label, setLabel] = useDebouncedField(
        option.label,
        (next) => onCommit(option.id, next),
    )

    return (
        <div className='flex items-center gap-2'>
            <Circle className='size-4 shrink-0 text-ink-400' aria-hidden />
            <Input
                id={`${option.id}-label`}
                value={label}
                autoFocus={autoFocus}
                aria-label={`ตัวเลือกที่ ${index + 1}`}
                onChange={(e) => setLabel(e.target.value)}

                onKeyDown={(e) => {
                    if (e.key !== 'Enter') return
                    e.preventDefault()
                    onEnter()
                }}
                placeholder={`ตัวเลือกที่ ${index + 1}`}
            />
            <Button
                type='button'
                variant='ghost'
                size='icon'
                aria-label={`ลบตัวเลือกที่ ${index + 1}`}
                disabled={!canRemove}
                className='shrink-0 text-ink-500 hover:bg-red-100 hover:text-red-200'
                onClick={() => onRemove(option.id)}
            >
                <Trash2 />
            </Button>
        </div>
    )
}
