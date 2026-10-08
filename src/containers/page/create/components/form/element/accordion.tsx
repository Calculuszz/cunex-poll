'use client'
import React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from "@/components/ui/textarea"
import { Label } from '@/components/ui/label'
import { useDebouncedField } from '@/hooks/useDebouncedField'
import { useElementStore, type ElementItem } from '@/store/elementStore'

export type AccordionElementType = Extract<ElementItem, { type: "accordion" }>

export function AccordionElement({ item }: { item: AccordionElementType }) {
    const update = useElementStore((s) => s.update)

    const [title, setTitle] = useDebouncedField(
        item.title ?? "",
        (next) => update(item.id, { title: next })
    )

    const [text, setText] = useDebouncedField(
        item.body,
        (next) => update(item.id, { body: next })
    )

    return (
        <div className='flex flex-col gap-2'>
            <div className='flex gap-2 flex-col'>
                <Label htmlFor={`heading-${item.id}`} className='text-lg font-bold'>หัวข้อ</Label>
                <Input
                    id={`heading-${item.id}`}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='ใส่หัวข้อ'
                />
            </div>
            <div className='flex gap-2 flex-col'>
                <Label htmlFor={`textArea-${item.id}`} className='text-lg font-bold'>เนื้อหา</Label>
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
