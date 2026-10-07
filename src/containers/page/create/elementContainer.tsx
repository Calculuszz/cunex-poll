'use client'
import React, { useEffect, useState } from 'react'
import { PollAddElement } from '@/containers/page/create/components'
import { CheckboxInput } from '@/containers/page/create/components/form/input/checkbox'
import { FormItemCard } from '@/containers/page/create/components/form/formItemCard'
import { TextInput } from '@/containers/page/create/components/form/input/text'
import { RadioInput } from '@/containers/page/create/components/form/input/radio'
import { useElementStore } from '@/store/elementStore'
import { SelectInput } from '@/containers/page/create/components/form/input/selector'
import { TextElement } from "@/containers/page/create/components/form/element/text"
import { AccordionElement } from '@/containers/page/create/components/form/element/accordion'
import { PopupElement } from './components/form/element/popup'


export function ElementContainer() {
    const items = useElementStore(s => s.items)

    return (
        <div className=' flex flex-col gap-2'>
            <span className=' text-xl font-heading font-bold'>คำถามและองค์ประกอบ</span>

            <div className='flex flex-col gap-2'>
                {items.map((item, index) => {
                    const qindex = items.filter(q => q.kind === "input")
                    const eindex = items.filter(e => e.kind === "element")
                    if (item.kind === 'input' && item.type === 'text') {
                        return (
                            <FormItemCard key={item.id} item={item} index={qindex.indexOf(item)} title='คำถามแบบข้อความ'>
                                <TextInput item={item} />
                            </FormItemCard>
                        )
                    }
                    if (item.kind === 'input' && item.type === 'radio') {
                        return (
                            <FormItemCard key={item.id} item={item} index={qindex.indexOf(item)} title='คำถามแบบเลือกข้อเดียว'>
                                <RadioInput item={item} />
                            </FormItemCard>
                        )
                    }
                    if (item.kind === "input" && item.type === "checkbox") {
                        return (
                            <FormItemCard key={item.id} item={item} index={qindex.indexOf(item)} title='คำถามแบบเลือกหลายข้อ'>
                                <CheckboxInput item={item} />
                            </FormItemCard>
                        )
                    }
                    if (item.kind === "input" && item.type === "select") {
                        return (
                            <FormItemCard key={item.id} item={item} index={qindex.indexOf(item)} title='คำถามแบบเลือกจากรายการ'>
                                <SelectInput item={item} />
                            </FormItemCard>
                        )
                    }
                    if (item.kind === "element" && item.type === "text") {
                        return (
                            <FormItemCard key={item.id} item={item} index={eindex.indexOf(item)} title='คำอธิบาย'>
                                <TextElement item={item} />
                            </FormItemCard>
                        )
                    }
                    if (item.kind === "element" && item.type === "accordion") {
                        return (
                            <FormItemCard key={item.id} item={item} index={eindex.indexOf(item)} title='หัวข้อพับเก็บ'>
                                <AccordionElement item={item} />
                            </FormItemCard>
                        )
                    }
                    if (item.kind === "element" && item.type === "dialog") {
                        return (
                            <FormItemCard key={item.id} item={item} index={eindex.indexOf(item)} title='ป๊อปอัพข้อมูล'>
                                <PopupElement item={item} />
                            </FormItemCard>
                        )
                    }
                    return null
                })}
            </div>

            <PollAddElement/>
        </div>
    )
}
