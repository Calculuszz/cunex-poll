'use client'
import React, { useState } from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import type { InputItem, Option } from '@/store/elementStore'
import { effectiveMaxSelect } from '@/lib/pollMappers'
import { cn } from '@/lib/utils'

type ChoiceItem = Extract<InputItem, { options: Option[] }>

// การ์ดตัวเลือกทั้งใบเป็นที่กด (label ห่อปุ่มวิทยุ/ช่องติ๊ก) ขอบชมพูหนาขึ้นตอนเลือกด้วย ring ไม่ใช่ border-2 กันการ์ดขยับ
const cardClass = cn(
    'relative flex min-h-15 w-full cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left',
    'transition-colors duration-150 hover:bg-inner-bg/60',
    'has-data-checked:border-primary has-data-checked:ring-1 has-data-checked:ring-primary',
    'has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
)

// ตัวเลือกที่มีรูปวางรูปไว้บน ข้อความเป็นคำบรรยายใต้รูป ทั้งแบบ 1 และ 2 คอลัมน์
const stackedCardClass = 'flex-col items-stretch p-2'

// ตัวเลือกที่มีรูปหรือรายละเอียด กดแล้วเปิด dialog ให้ดูรูปเต็มกับรายละเอียดก่อนยืนยันเลือก
// ตัดช่องว่างก่อนตัดสิน ให้ตรงกับหน้าสร้างโพล (ช่องที่เหลือแค่ช่องว่าง/ขึ้นบรรทัด ถือว่าว่าง)
const hasDetail = (o: Option) => !!o.imageUrl?.trim() || !!o.info?.body?.trim()

// รูปตัวเลือกล็อก 1:1 ทุก layout ให้ทุกตัวเลือกสูงเท่ากัน รูปเต็มไม่ครอปดูได้ใน dialog
function OptionContent({ option }: { option: Option }) {
    return (
        <>
            {option.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={option.imageUrl}
                    alt={option.imageAlt ?? ''}
                    loading='lazy'
                    className='aspect-square w-full rounded-lg object-cover'
                />
            )}
            <span className={cn('min-w-0 flex-1 break-words', option.imageUrl && 'px-1 pr-8')}>{option.label}</span>
        </>
    )
}

// ปุ่มวิทยุ/ช่องติ๊กของการ์ดที่มีรูปลอยอยู่มุมขวาบนของรูป ของการ์ดไม่มีรูปอยู่ท้ายแถว
const markClass = (option: Option) => cn('size-5 shrink-0', option.imageUrl && 'absolute top-3 right-3 bg-background')

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

// รายละเอียดตัวเลือก: รูปเต็มไม่ครอป + คำอธิบาย ท้าย dialog ให้ยืนยันเลือกหรือกลับไปเลือกตัวอื่น
// onSelect ไม่มี = โหมดอ่านอย่างเดียว เหลือแค่ปุ่มปิด
function OptionDetailDialog({ option, onClose, onSelect, blockedReason }: {
    option: Option | null
    onClose: () => void
    onSelect?: (option: Option) => void
    // เลือกเพิ่มไม่ได้ (เช่นเลือกครบเพดานแล้ว) ยังดูรายละเอียดได้แต่ปุ่มเลือกกดไม่ได้
    blockedReason?: string | null
}) {
    // เก็บตัวล่าสุดไว้ระหว่าง animation ปิด ไม่งั้นเนื้อหาหายก่อน dialog จางหมด
    const [shown, setShown] = useState(option)
    if (option && option !== shown) setShown(option)
    const o = option ?? shown

    return (
        <Dialog open={option !== null} onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogContent className='flex flex-col gap-3'>
                {o?.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.imageUrl} alt={o.imageAlt ?? ''} className='max-h-[60dvh] w-full rounded-lg bg-inner-bg object-contain' />
                )}
                <DialogTitle className='pr-8 font-heading text-xl font-bold break-words'>{o?.info?.title || o?.label}</DialogTitle>
                {o?.info?.title && o.info.title !== o.label && <p className='-mt-2 text-ink-500 break-words'>{o.label}</p>}
                {o?.info?.body && (
                    <DialogDescription className='text-base break-words whitespace-pre-line text-foreground'>{o.info.body}</DialogDescription>
                )}
                <div className='flex w-full flex-col gap-2 pt-2'>
                    {onSelect ? (
                        <>
                            {blockedReason && <p role='alert' className='text-center text-sm text-destructive'>{blockedReason}</p>}
                            <Button
                                className='h-11 rounded-full font-heading text-base font-bold'
                                disabled={!!blockedReason}
                                onClick={() => o && onSelect(o)}
                            >
                                เลือกตัวเลือกนี้
                            </Button>
                            <Button variant='outline' className='h-11 rounded-full font-heading text-base font-bold' onClick={onClose}>
                                เลือกตัวเลือกอื่น
                            </Button>
                        </>
                    ) : (
                        <Button variant='outline' className='h-11 rounded-full font-heading text-base font-bold' onClick={onClose}>
                            ปิด
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function ChoiceOptions({ question, value, onChange, readOnly, labelledBy }: {
    question: ChoiceItem
    value: string | string[] | undefined
    onChange?: (value: string | string[] | undefined) => void
    readOnly?: boolean
    labelledBy: string
}) {
    const [detail, setDetail] = useState<Option | null>(null)
    // 'grid' = 2 คอลัมน์ · 'list' = 1 คอลัมน์
    const twoCols = question.type !== 'select' && question.optionLayout === 'grid'
    const listClass = twoCols ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'
    const picked = Array.isArray(value) ? value : value ? [value] : []
    const maxSelect = question.type === 'checkbox' ? effectiveMaxSelect(question) : undefined
    const atMax = maxSelect !== undefined && picked.length >= maxSelect
    const maxMessage = `เลือกได้สูงสุด ${maxSelect} ตัวเลือก เอาตัวเลือกอื่นออกก่อน`

    // คงลำดับตามตัวเลือก ไม่ใช่ตามลำดับที่กด
    const ordered = (ids: string[]) => question.options.map((x) => x.id).filter((id) => ids.includes(id))

    const select = (o: Option) => {
        setDetail(null)
        if (question.type === 'checkbox') onChange?.(ordered([...picked, o.id]))
        else onChange?.(o.id)
    }

    if (readOnly) {
        return (
            <>
                <ul className={listClass} aria-labelledby={labelledBy}>
                    {question.options.map((o) => {
                        const checked = picked.includes(o.id)
                        const content = (
                            <>
                                <OptionContent option={o} />
                                <span className={o.imageUrl ? 'absolute top-3 right-3' : undefined}>
                                    <ReadOnlyMark checked={checked} square={question.type === 'checkbox'} />
                                </span>
                                {checked && <span className='sr-only'>(เลือกข้อนี้)</span>}
                            </>
                        )
                        const className = cn(cardClass, o.imageUrl && stackedCardClass, checked && 'border-primary ring-1 ring-primary')
                        return (
                            <li key={o.id} className='flex'>
                                {hasDetail(o) ? (
                                    <button type='button' className={cn(className, 'outline-none focus-visible:ring-3 focus-visible:ring-ring/50')} onClick={() => setDetail(o)}>
                                        {content}
                                    </button>
                                ) : (
                                    <div className={cn(className, 'cursor-default hover:bg-card')}>{content}</div>
                                )}
                            </li>
                        )
                    })}
                </ul>
                <OptionDetailDialog option={detail} onClose={() => setDetail(null)} />
            </>
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

    const dialog = (
        <OptionDetailDialog
            option={detail}
            onClose={() => setDetail(null)}
            onSelect={select}
            blockedReason={detail && atMax && !picked.includes(detail.id) ? maxMessage : null}
        />
    )

    if (question.type === 'radio') {
        return (
            <>
                <RadioGroup
                    value={typeof value === 'string' ? value : null}
                    onValueChange={(v) => {
                        // ตัวเลือกที่มีรายละเอียดยังไม่เลือกจริงจนกว่าจะกดยืนยันใน dialog (ค่ายังเป็นตัวเดิมเพราะเป็น controlled)
                        const o = question.options.find((x) => x.id === v)
                        if (o && hasDetail(o)) setDetail(o)
                        else onChange?.(v as string)
                    }}
                    aria-labelledby={labelledBy}
                    className={listClass}
                >
                    {question.options.map((o) => (
                        <label key={o.id} className={cn(cardClass, o.imageUrl && stackedCardClass)}>
                            <OptionContent option={o} />
                            <RadioGroupItem value={o.id} className={markClass(o)} />
                        </label>
                    ))}
                </RadioGroup>
                {dialog}
            </>
        )
    }

    return (
        <>
            <div role='group' aria-labelledby={labelledBy} className={listClass}>
                {question.options.map((o) => {
                    const checked = picked.includes(o.id)
                    return (
                        <label key={o.id} className={cn(cardClass, o.imageUrl && stackedCardClass, atMax && !checked && 'opacity-60')}>
                            <OptionContent option={o} />
                            <Checkbox
                                checked={checked}
                                onCheckedChange={(next) => {
                                    // เอาออกทำได้ทันที เลือกเพิ่มต้องผ่านเพดานและ dialog รายละเอียด (ถ้ามี)
                                    if (!next) return onChange?.(picked.filter((id) => id !== o.id))
                                    if (hasDetail(o)) return setDetail(o)
                                    if (atMax) return void toast.error(maxMessage)
                                    onChange?.(ordered([...picked, o.id]))
                                }}
                                className={markClass(o)}
                            />
                        </label>
                    )
                })}
            </div>
            {dialog}
        </>
    )
}
