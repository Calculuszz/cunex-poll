'use client'
import React from 'react'
import { PollAddElement } from '@/containers/page/create/components'
import { CheckboxInput } from '@/containers/page/create/components/form/input/checkbox'
import { FormItemCard } from '@/containers/page/create/components/form/formItemCard'
import { TextInput } from '@/containers/page/create/components/form/input/text'
import { RadioInput } from '@/containers/page/create/components/form/input/radio'
import { useElementStore, type FormItem } from '@/store/elementStore'
import { SelectInput } from '@/containers/page/create/components/form/input/selector'
import { TextElement } from "@/containers/page/create/components/form/element/text"
import { AccordionElement } from '@/containers/page/create/components/form/element/accordion'
import { PopupElement } from './components/form/element/popup'
import { ImageElement } from './components/form/element/image'
import { PageBreakElement } from './components/form/element/pagebreak'

const INPUT_TITLE: Record<Extract<FormItem, { kind: 'input' }>['type'], string> = {
    text: 'คำถามแบบข้อความ',
    radio: 'คำถามแบบเลือกข้อเดียว',
    checkbox: 'คำถามแบบเลือกหลายข้อ',
    select: 'คำถามแบบเลือกจากรายการ',
}

const ELEMENT_TITLE: Record<Extract<FormItem, { kind: 'element' }>['type'], string> = {
    text: 'คำอธิบาย',
    image: 'รูปภาพ',
    dialog: 'ป๊อปอัพข้อมูล',
    accordion: 'หัวข้อพับเก็บ',
    pagebreak: 'ขึ้นหน้าใหม่',
}

function FormItemBody({ item, page, isEmptyPage }: { item: FormItem; page: number; isEmptyPage: boolean }) {
    if (item.kind === 'input') {
        switch (item.type) {
            case 'text':     return <TextInput item={item} />
            case 'radio':    return <RadioInput item={item} />
            case 'checkbox': return <CheckboxInput item={item} />
            case 'select':   return <SelectInput item={item} />
        }
    }
    switch (item.type) {
        case 'text':      return <TextElement item={item} />
        case 'image':     return <ImageElement item={item} />
        case 'dialog':    return <PopupElement item={item} />
        case 'accordion': return <AccordionElement item={item} />
        case 'pagebreak': return <PageBreakElement page={page} isEmptyPage={isEmptyPage} />
    }
}

// เลขข้อนับแยกกันระหว่างคำถามกับองค์ประกอบ แต่การเลื่อน/ลบต้องใช้ตำแหน่งจริงในลิสต์รวม เลยต้องพกไปทั้งสองค่า
function toRows(items: FormItem[]) {
    let question = 0
    let element = 0
    let page = 1
    return items.map((item, position) => {
        const number = item.kind === 'input' ? ++question : ++element
        if (item.kind === 'element' && item.type === 'pagebreak') page += 1
        const next = items[position + 1]
        const isEmptyPage = !next || (next.kind === 'element' && next.type === 'pagebreak')
        return { item, position, number, page, isEmptyPage }
    })
}

export function ElementContainer() {
    const items = useElementStore(s => s.items)
    const rows = toRows(items)

    return (
        <div className=' flex flex-col gap-2'>
            <span className=' text-xl font-heading font-bold'>คำถามและองค์ประกอบ</span>

            <div className='flex flex-col gap-2'>
                {rows.map(({ item, position, number, page, isEmptyPage }) => (
                    <FormItemCard
                        key={item.id}
                        item={item}
                        position={position}
                        number={number}
                        title={item.kind === 'input' ? INPUT_TITLE[item.type] : ELEMENT_TITLE[item.type]}
                    >
                        <FormItemBody item={item} page={page} isEmptyPage={isEmptyPage} />
                    </FormItemCard>
                ))}
            </div>

            <PollAddElement/>
        </div>
    )
}
