'use client'
import React, { useState } from 'react'
import { ImageOff, Pen, Trash2, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useDebouncedField } from '@/hooks/useDebouncedField'
import { cn } from '@/lib/utils'
import { useElementStore, type Option } from '@/store/elementStore'
import { type OptionLayout } from './optionLayout'

export type OptionPatch = Partial<Omit<Option, 'info'>> & { info?: Partial<NonNullable<Option['info']>> }
type CommitOption = (optionId: string, patch: OptionPatch) => void

export function useOptionCommit(itemId: string): CommitOption {
    const update = useElementStore((s) => s.update)

    return (optionId, patch) => {
        const current = useElementStore.getState().items.find((i) => i.id === itemId)
        if (!current || !('options' in current)) return
        if (!current.options.some((o) => o.id === optionId)) return
        update(itemId, {
            options: current.options.map((o) =>
                o.id === optionId
                    ? { ...o, ...patch, ...(patch.info ? { info: { ...o.info, ...patch.info } } : {}) }
                    : o,
            ),
        })
    }
}

export function OptionRow({
    option,
    index,
    icon: Icon,
    layout,
    autoFocus,
    canRemove,
    onCommit,
    onRemove,
    onEnter,
}: {
    option: Option
    index: number
    icon?: LucideIcon
    layout?: OptionLayout
    autoFocus: boolean
    canRemove: boolean
    onCommit: CommitOption
    onRemove: (optionId: string) => void
    onEnter: () => void
}) {
    const [label, setLabel] = useDebouncedField(
        option.label,
        (next) => onCommit(option.id, { label: next }),
    )

    const image = layout ? option.imageUrl?.trim() : undefined
    const hasInfo = Boolean(option.info?.title?.trim() || option.info?.body?.trim())

    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-2',
                image && 'rounded-card border border-badge p-2 sm:rounded-none sm:border-0 sm:p-0',
            )}
        >
            {Icon ? (
                <Icon className='size-4 shrink-0 text-ink-400' aria-hidden />
            ) : (
                <span className='w-4 shrink-0 text-center text-sm text-ink-400' aria-hidden>
                    {index + 1}
                </span>
            )}

            {image ? (
                <OptionThumb
                    src={image}
                    alt={option.imageAlt ?? ''}
                    className="size-9"
                />
            ) : null}

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
                className={cn(
                    'grow',
                    image ? 'order-last basis-full sm:order-none sm:basis-0' : 'basis-0',
                )}
            />

            <div className={cn('flex shrink-0 items-center gap-1', image && 'ml-auto sm:ml-0')}>
                {layout ? (
                    <OptionInfoDialog
                        option={option}
                        index={index}
                        layout={layout}
                        hasContent={Boolean(image) || hasInfo}
                        onCommit={onCommit}
                    />
                ) : null}

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
        </div>
    )
}

function OptionInfoDialog({
    option,
    index,
    layout,
    hasContent,
    onCommit,
}: {
    option: Option
    index: number
    layout: OptionLayout
    hasContent: boolean
    onCommit: CommitOption
}) {
    return (
        <Dialog>
            <DialogTrigger
                render={
                    <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        aria-label={`แก้ไขข้อมูลของตัวเลือกที่ ${index + 1}`}
                        className={cn(
                            'shrink-0 hover:bg-yellow-100 hover:text-yellow-200',
                            hasContent ? 'bg-yellow-100 text-yellow-200' : 'text-ink-500',
                        )}
                    />
                }
            >
                <Pen />
            </DialogTrigger>

            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle className='font-heading text-base font-bold'>
                        ข้อมูลของตัวเลือกที่ {index + 1}
                    </DialogTitle>
                    <DialogDescription>
                        {layout === 'grid'
                            ? 'ตัวเลือกชุดนี้แสดงเป็นตาราง รูปจะใหญ่และเด่นกว่าข้อความ'
                            : 'ตัวเลือกชุดนี้แสดงเป็นรายการ รูปกับข้อความมีน้ำหนักเท่ากัน'}
                    </DialogDescription>
                </DialogHeader>

                <OptionInfoFields option={option} layout={layout} onCommit={onCommit} />

                <DialogFooter>
                    <DialogClose render={<Button type='button' variant='default' />} className={`text-lg px-4 font-heading `}>เสร็จสิ้น</DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function OptionInfoFields({
    option,
    layout,
    onCommit,
}: {
    option: Option
    layout: OptionLayout
    onCommit: CommitOption
}) {
    const [imageUrl, setImageUrl] = useDebouncedField(
        option.imageUrl ?? '',
        (next) => onCommit(option.id, { imageUrl: next.trim() || undefined }),
    )
    const [imageAlt, setImageAlt] = useDebouncedField(
        option.imageAlt ?? '',
        (next) => onCommit(option.id, { imageAlt: next.trim() || undefined }),
    )
    const [infoTitle, setInfoTitle] = useDebouncedField(
        option.info?.title ?? '',
        (next) => onCommit(option.id, { info: { title: next } }),
    )
    const [infoBody, setInfoBody] = useDebouncedField(
        option.info?.body ?? '',
        (next) => onCommit(option.id, { info: { body: next } }),
    )
    const [infoTrigger, setInfoTrigger] = useDebouncedField(
        option.info?.trigger ?? '',
        (next) => onCommit(option.id, { info: { trigger: next } }),
    )

    const preview = imageUrl.trim()

    return (
        <div className='flex max-h-[60vh] flex-col gap-4 overflow-y-auto'>
            <div className='flex flex-col gap-2'>
                <Label htmlFor={`${option.id}-image`} className='text-base font-bold'>
                    รูปของตัวเลือก
                </Label>
                <Input
                    id={`${option.id}-image`}
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder='วางลิงก์รูป เช่น https://...'
                />

                {preview ? (
                    <OptionThumb
                        src={preview}
                        alt={imageAlt}
                        className={cn('w-full', layout === 'grid' ? 'aspect-video' : 'aspect-3/1')}
                    />
                ) : null}

                <Input
                    id={`${option.id}-image-alt`}
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    aria-label='คำอธิบายรูป'
                    placeholder='คำอธิบายรูปสำหรับคนที่มองไม่เห็น'
                />
                <span className='text-sm text-ink-500'>
                    {layout === 'grid'
                        ? 'รูปคือสิ่งที่ผู้โหวตเห็นก่อน ข้อความจะเป็นคำบรรยายใต้รูป'
                        : 'รูปจะแสดงข้างข้อความในขนาดพอๆ กัน'}
                </span>
            </div>

            <div className='flex flex-col gap-2'>
                <Label htmlFor={`${option.id}-info-title`} className='text-base font-bold'>
                    ข้อมูลเพิ่มเติม
                </Label>
                <Input
                    id={`${option.id}-info-title`}
                    value={infoTitle}
                    onChange={(e) => setInfoTitle(e.target.value)}
                    placeholder='หัวข้อ เช่น ประวัติผู้สมัคร'
                />
                <Textarea
                    id={`${option.id}-info-body`}
                    value={infoBody}
                    onChange={(e) => setInfoBody(e.target.value)}
                    aria-label='รายละเอียดข้อมูลเพิ่มเติม'
                    placeholder='รายละเอียดที่ผู้โหวตกดดูได้ก่อนตัดสินใจ'
                />
                <Input
                    id={`${option.id}-info-trigger`}
                    value={infoTrigger}
                    onChange={(e) => setInfoTrigger(e.target.value)}
                    aria-label='ข้อความบนปุ่มเปิดข้อมูล'
                    placeholder='ข้อความบนปุ่ม เช่น ดูข้อมูล (ไม่ใส่ก็ได้)'
                />
                <span className='text-sm text-ink-500'>
                    ถ้าเว้นว่างทั้งหมด ตัวเลือกนี้จะไม่มีปุ่มดูข้อมูลเพิ่มเติม
                </span>
            </div>
        </div>
    )
}

function OptionThumb({ src, alt, className }: { src: string; alt: string; className?: string }) {
    const [brokenSrc, setBrokenSrc] = useState<string | null>(null)
    const broken = brokenSrc === src

    return (
        <div
            className={cn(
                'flex shrink-0 items-center justify-center overflow-hidden rounded-input border border-badge bg-inner-bg',
                className,
            )}
        >
            {broken ? (
                <ImageOff className='size-4 text-ink-400' aria-label='โหลดรูปไม่สำเร็จ' />
            ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={src}
                    alt={alt}
                    className='size-full object-cover'
                    onError={() => setBrokenSrc(src)}
                    onLoad={() => setBrokenSrc(null)}
                />
            )}
        </div>
    )
}
