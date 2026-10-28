'use client'
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from "@/components/ui/textarea"
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { TextAlignCenter, TextAlignEnd, TextAlignStart } from 'lucide-react'
import { useDebouncedField } from '@/hooks/useDebouncedField'
import { useElementStore, type ElementItem, type TextAlign } from '@/store/elementStore'

const ALIGNS: { value: TextAlign; label: string; icon: typeof TextAlignStart }[] = [
    { value: 'left', label: 'ชิดซ้าย', icon: TextAlignStart },
    { value: 'center', label: 'กึ่งกลาง', icon: TextAlignCenter },
    { value: 'right', label: 'ชิดขวา', icon: TextAlignEnd },
]

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
                <Label htmlFor={`htitle-switch-${item.id}`} className='text-lg font-bold'>หัวข้อ</Label>
            </div>
            {htitle && (
                <Input
                    aria-label='หัวข้อ'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='ใส่หัวข้อ'
                />
            )}
            <div className='flex flex-col gap-2'>
                <span id={`align-${item.id}`} className='text-lg font-bold'>การจัดวางข้อความ</span>
                <ToggleGroup
                    aria-labelledby={`align-${item.id}`}
                    variant='outline'
                    spacing={0}
                    value={[item.align ?? 'left']}
                    // กดปุ่มที่เลือกอยู่ซ้ำจะได้ค่าว่าง ไม่ให้หลุดเป็นไม่มีการจัดวาง
                    onValueChange={(next) => { if (next[0]) update(item.id, { align: next[0] as TextAlign }) }}
                >
                    {ALIGNS.map(({ value, label, icon: Icon }) => (
                        <ToggleGroupItem key={value} value={value} aria-label={label} className='h-10 gap-1.5 px-3 text-base aria-pressed:bg-primary/10 aria-pressed:text-primary'>
                            <Icon />
                            <span>{label}</span>
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </div>
            <div className='flex gap-2 flex-col'>
                <Label htmlFor={`textArea-${item.id}`} className='text-lg font-bold'>
                    เนื้อหา{htitle && <span className='text-sm font-normal text-ink-500'> (ไม่บังคับ ถ้ามีหัวข้อแล้ว)</span>}
                </Label>
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
