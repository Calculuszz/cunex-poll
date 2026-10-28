'use client'
import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageInput } from '@/components/common/imageInput'
import { useDebouncedField } from '@/hooks/useDebouncedField'
import { useElementStore, type ElementItem } from '@/store/elementStore'

export type ImageElementType = Extract<ElementItem, { type: "image" }>

export function ImageElement({ item }: { item: ImageElementType }) {
    const update = useElementStore((s) => s.update)

    const [alt, setAlt] = useDebouncedField(
        item.alt ?? "",
        (next) => update(item.id, { alt: next })
    )

    const [caption, setCaption] = useDebouncedField(
        item.caption ?? "",
        (next) => update(item.id, { caption: next })
    )

    return (
        <div className='flex flex-col gap-2'>
            <ImageInput
                label='รูปที่จะแสดง'
                hint='ใช้ได้ทุกอัตราส่วน รูปแสดงเต็มความกว้างตามสัดส่วนจริงโดยไม่ถูกครอป · แนะนำกว้างอย่างน้อย 1080 px'
                value={item.url || undefined}
                alt={alt}
                onChange={(next) => update(item.id, { url: next ?? "" })}
            />
            <div className='flex flex-col gap-2'>
                <Label htmlFor={`alt-${item.id}`} className='text-lg font-bold'>คำอธิบายรูป</Label>
                <Input
                    id={`alt-${item.id}`}
                    value={alt}
                    onChange={(e) => setAlt(e.target.value)}
                    placeholder='เช่น แผนผังอาคารที่จัดงาน'
                    aria-describedby={`alt-hint-${item.id}`}
                />
                <span id={`alt-hint-${item.id}`} className='text-sm text-ink-500'>
                    ใช้อ่านให้ผู้ที่มองไม่เห็นรูปฟัง และแสดงแทนเมื่อรูปโหลดไม่ขึ้น
                </span>
            </div>
            <div className='flex flex-col gap-2'>
                <Label htmlFor={`caption-${item.id}`} className='text-lg font-bold'>คำบรรยายใต้รูป (ไม่บังคับ)</Label>
                <Input
                    id={`caption-${item.id}`}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder='ข้อความที่แสดงใต้รูป'
                />
            </div>
        </div>
    )
}
