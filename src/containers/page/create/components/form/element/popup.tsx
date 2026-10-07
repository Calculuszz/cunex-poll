'use client'
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from "@/components/ui/textarea"
import { Label } from '@/components/ui/label'
import { useDebouncedField } from '@/hooks/useDebouncedField'
import { useElementStore, type ElementItem } from '@/store/elementStore'
import { ImageInput } from '@/components/common/imageInput'

export type PopupElementType = Extract<ElementItem, { type: "dialog" }>

export function PopupElement({ item }: { item: PopupElementType }) {
    const update = useElementStore((s) => s.update)

    const [title, setTitle] = useDebouncedField(
        item.title ?? "",
        (next) => update(item.id, { title: next })
    )

    const [trigger, setTrigger] = useDebouncedField(
        item.trigger ?? "",
        (next) => update(item.id, { trigger: next })
    )

    const [text, setText] = useDebouncedField(
        item.body,
        (next) => update(item.id, { body: next })
    )

    return (
        <div className='flex flex-col gap-2'>
            <div className='flex gap-2 flex-col'>
                <Label htmlFor={`popup-${item.id}`} className='text-bold text-lg font-bold'>ข้อความบนปุ่ม</Label>
                <Input
                    id={`popup-${item.id}`}
                    value={trigger}
                    onChange={(e) => setTrigger(e.target.value)}
                    placeholder='ใส่หัวข้อ'
                />
            </div>
            <ImageInput/>
            <div className='flex gap-2 flex-col'>
                <Label htmlFor={`heading-${item.id}`} className='text-bold text-lg font-bold'>หัวข้อ</Label>
                <Input
                    id={`heading-${item.id}`}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='ใส่หัวข้อ'
                />
            </div>
            <div>
                <Label htmlFor={`textArea-${item.id}`} className='text-bold text-lg font-bold'>เนื้อหา</Label>
                <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder='ใส่เนื้อหาของคุณ'
                    className='min-h-30'
                    id={`textArea-${item.id}`}
                />
            </div>
        </div>
    )
}
