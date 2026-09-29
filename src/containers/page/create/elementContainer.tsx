'use client'
import React, { useEffect, useState } from 'react'
import { PollAddElement } from '@/containers/page/create/components'
import { CheckboxInput } from '@/containers/page/create/components/form/input/checkbox'
import { FormItemCard } from '@/containers/page/create/components/form/formItemCard'
import { TextInput } from '@/containers/page/create/components/form/input/text'
import { RadioInput } from '@/containers/page/create/components/form/input/radio'
import { useElementStore } from '@/store/elementStore'
import { SelectInput } from '@/containers/page/create/components/form/input/selector'


export function ElementContainer() {
    const items = useElementStore(s => s.items)

    useEffect(() => {
        console.log(items)
    }, [items])

    return (
        <div className=' flex flex-col gap-2'>
            <span className=' text-xl font-heading font-bold'>คำถามและองค์ประกอบ</span>

            <div className='flex flex-col gap-2'>
                {items.map((item, index) => {
                    if (item.kind === 'input' && item.type === 'text') {
                        return (
                            <FormItemCard key={item.id} item={item} index={index} title='คำถามแบบข้อความ'>
                                <TextInput item={item} />
                            </FormItemCard>
                        )
                    }
                    if (item.kind === 'input' && item.type === 'radio') {
                        return (
                            <FormItemCard key={item.id} item={item} index={index} title='คำถามแบบเลือกข้อเดียว'>
                                <RadioInput item={item} />
                            </FormItemCard>
                        )
                    }
                    if (item.kind === "input" && item.type === "checkbox") {
                        return (
                            <FormItemCard key={item.id} item={item} index={index} title='คำถามแบบเลือกหลายข้อ'>
                                <CheckboxInput item={item} />
                            </FormItemCard>
                        )
                    }
                    if (item.kind === "input" && item.type === "select") {
                        return (
                            <FormItemCard key={item.id} item={item} index={index} title='คำถามแบบเลือกจากรายการ'>
                                <SelectInput item={item} />
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
