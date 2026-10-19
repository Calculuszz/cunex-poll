'use client'
import React from 'react'
import { Check, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import type { InputItem, Option } from '@/store/elementStore'
import { cn } from '@/lib/utils'

type ChoiceItem = Extract<InputItem, { options: Option[] }>

// การ์ดตัวเลือกทั้งใบเป็นที่กด (label ห่อปุ่มวิทยุ/ช่องติ๊ก) ขอบชมพูหนาขึ้นตอนเลือกด้วย ring ไม่ใช่ border-2 กันการ์ดขยับ
const cardClass = cn(
    'relative flex min-h-15 w-full cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3',
    'transition-colors duration-150 hover:bg-inner-bg/60',
    'has-data-checked:border-primary has-data-checked:ring-1 has-data-checked:ring-primary',
    'has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
)

const gridCardClass = 'flex-col items-stretch p-2'

// ตัวเลือกที่มีรายละเอียดเพิ่ม (info) เปิด dialog แยก
// ปุ่มนี้ต้องอยู่หลังช่องเลือกใน DOM: label ส่งคลิกไปที่ control ตัวแรกข้างใน ถ้าปุ่มมาก่อน กดข้อความจะเปิด dialog แทนการเลือก
// (ตำแหน่งที่เห็นยังอยู่ก่อนช่องเลือกด้วย order-1 / order-2)
function OptionInfo({ option }: { option: Option }) {
    if (!option.info?.body) return null
    return (
        <Dialog>
            <DialogTrigger
                render={<Button type='button' variant='ghost' size='sm' className='order-1 shrink-0 text-primary' onClick={(e) => e.stopPropagation()} />}
            >
                <Info />
                {option.info.trigger || 'ดูข้อมูล'}
            </DialogTrigger>
            <DialogContent className='flex max-h-[85vh] flex-col gap-3 overflow-y-auto'>
                <DialogTitle className='font-heading text-xl font-bold'>{option.info.title || option.label}</DialogTitle>
                <DialogDescription className='text-base break-words whitespace-pre-line text-foreground'>{option.info.body}</DialogDescription>
            </DialogContent>
        </Dialog>
    )
}

function OptionContent({ option, grid }: { option: Option; grid: boolean }) {
    return (
        <>
            {option.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={option.imageUrl}
                    alt={option.imageAlt ?? ''}
                    loading='lazy'
                    className={grid ? 'aspect-square w-full rounded-lg object-cover' : 'size-12 shrink-0 rounded-md object-cover'}
                />
            )}
            <span className={cn('min-w-0 flex-1 break-words', grid && 'px-1')}>{option.label}</span>
        </>
    )
}

// ตัวเลือกแบบโหมดอ่านอย่างเดียว (หน้าดูคำตอบของคุณ) ใช้หน้าตาเดียวกันแต่ไม่มีปุ่มให้กด
function ReadOnlyMark({ checked, square }: { checked: boolean; square: boolean }) {
    return (
        <span
            aria-hidden
            className={cn(
                'flex size-5 shrink-0 items-center justify-center border',
                square ? 'rounded-[4px]' : 'rounded-full',
                checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
            )}
        >
            {checked && (square ? <Check className='size-3.5' /> : <span className='size-2 rounded-full bg-primary-foreground' />)}
        </span>
    )
}

export function ChoiceOptions({ question, value, onChange, readOnly, labelledBy }: {
    question: ChoiceItem
    value: string | string[] | undefined
    onChange?: (value: string | string[] | undefined) => void
    readOnly?: boolean
    labelledBy: string
}) {
    const grid = question.type !== 'select' && question.optionLayout === 'grid'
    const listClass = grid ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'
    const picked = Array.isArray(value) ? value : value ? [value] : []

    if (readOnly) {
        return (
            <ul className={listClass} aria-labelledby={labelledBy}>
                {question.options.map((o) => {
                    const checked = picked.includes(o.id)
                    return (
                        <li
                            key={o.id}
                            data-checked={checked || undefined}
                            className={cn(cardClass, 'cursor-default hover:bg-card', grid && gridCardClass, checked && 'border-primary ring-1 ring-primary')}
                        >
                            {grid ? (
                                <>
                                    <OptionContent option={o} grid />
                                    <span className='absolute top-3 right-3'><ReadOnlyMark checked={checked} square={question.type === 'checkbox'} /></span>
                                    <OptionInfo option={o} />
                                </>
                            ) : (
                                <>
                                    <OptionContent option={o} grid={false} />
                                    <span className='order-2'><ReadOnlyMark checked={checked} square={question.type === 'checkbox'} /></span>
                                    <OptionInfo option={o} />
                                </>
                            )}
                            {checked && <span className='sr-only'>(เลือกข้อนี้)</span>}
                        </li>
                    )
                })}
            </ul>
        )
    }

    if (question.type === 'select') {
        const items = question.options.map((o) => ({ value: o.id, label: o.label }))
        return (
            <Select items={items} value={typeof value === 'string' ? value : null} onValueChange={(v) => onChange?.(v ?? undefined)}>
                <SelectTrigger className='h-12! w-full text-base' aria-labelledby={labelledBy}>
                    <SelectValue placeholder='เลือกคำตอบ' />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {items.map((item) => (
                            <SelectItem key={item.value} value={item.value} className='text-base'>{item.label}</SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        )
    }

    if (question.type === 'radio') {
        return (
            <RadioGroup
                value={typeof value === 'string' ? value : null}
                onValueChange={(v) => onChange?.(v as string)}
                aria-labelledby={labelledBy}
                className={listClass}
            >
                {question.options.map((o) => (
                    <label key={o.id} className={cn(cardClass, grid && gridCardClass)}>
                        <OptionContent option={o} grid={grid} />
                        <RadioGroupItem value={o.id} className={cn('order-2 size-5', grid && 'absolute top-3 right-3 bg-background')} />
                        <OptionInfo option={o} />
                    </label>
                ))}
            </RadioGroup>
        )
    }

    return (
        <div role='group' aria-labelledby={labelledBy} className={listClass}>
            {question.options.map((o) => (
                <label key={o.id} className={cn(cardClass, grid && gridCardClass)}>
                    <OptionContent option={o} grid={grid} />
                    <Checkbox
                        checked={picked.includes(o.id)}
                        onCheckedChange={(checked) => {
                            const next = checked ? [...picked, o.id] : picked.filter((id) => id !== o.id)
                            // คงลำดับตามตัวเลือก ไม่ใช่ตามลำดับที่กด
                            onChange?.(question.options.map((x) => x.id).filter((id) => next.includes(id)))
                        }}
                        className={cn('order-2 size-5', grid && 'absolute top-3 right-3 bg-background')}
                    />
                    <OptionInfo option={o} />
                </label>
            ))}
        </div>
    )
}
