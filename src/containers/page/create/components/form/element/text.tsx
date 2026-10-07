'use client'
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from "@/components/ui/textarea"
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useDebouncedField } from '@/hooks/useDebouncedField'
import { useElementStore, type ElementItem } from '@/store/elementStore'

export type TextElementType = Extract<ElementItem, { type: "text" }>

export function TextElement({ item }: { item: TextElementType }) {
    const [htitle, setHtitle] = useState<boolean>(item.title ? item.title.length > 0 : true)
    const update = useElementStore((s) => s.update)

    const [title, setTitle] = useDebouncedField(
        item.title ?? "",
        (next) => update(item.id, { title: next })
    )

    const [text, setText] = useDebouncedField(
        item.body,
        (next) => update(item.id, { body: next })
    )

    const toggle = (checked: boolean) => {
        setHtitle(checked)
        if (!checked) {
            setTitle("")
            update(item.id, { title: "" })
        }
    }

    return (
        <div className='flex flex-col gap-2'>
            <div className='flex gap-2 items-center'>
                <Switch
                    id={`htitle-switch-${item.id}`}
                    onCheckedChange={toggle}
                    checked={htitle}
                />
                <Label htmlFor={`htitle-switch-${item.id}`} className='text-bold text-lg font-bold'>หัวข้อ</Label>
            </div>
            {htitle && (
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='ใส่หัวข้อ'
                />
            )}
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
