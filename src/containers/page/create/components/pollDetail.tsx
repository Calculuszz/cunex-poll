'use client'
import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DateTimePicker } from '@/components/common/dateTimePicker'
import { ImageInput } from '@/components/common/imageInput'
import { useCreatePollStore } from '@/store/createPollStore'

export function PollDetail() {
    const title = useCreatePollStore((s) => s.title)
    const desc = useCreatePollStore((s) => s.desc)
    const closeTime = useCreatePollStore((s) => s.closeTime)
    const update = useCreatePollStore((s) => s.update)
    // รูปปกยังไม่มีที่เก็บใน backend จึงยังไม่ถูกบันทึกลง store
    const [banner, setBanner] = useState<string>()

    return (
        <div className=' flex flex-col gap-1'>
            <span className='text-xl font-heading font-bold'>ข้อมูลโพล</span>
            <Card>
                <CardContent className='flex flex-col gap-1'>
                    <div>
                        <Label className=' font-bold text-lg'>ชื่อโพล</Label>
                        <Input placeholder='ชื่อโพล...' value={title} onChange={(e) => update({ title: e.target.value })}/>
                    </div>
                    <div>
                        <Label className=' font-bold text-lg'>คำอธิบาย</Label>
                        <Textarea placeholder='คำอธิบายโพล...' value={desc} onChange={(e) => update({ desc: e.target.value })}/>
                    </div>
                    <div className='flex flex-col gap-1'>
                        <Label className=' font-bold text-lg'>เวลาปิดโพล</Label>
                        <DateTimePicker
                            value={closeTime ? new Date(closeTime) : undefined}
                            onChange={(date) => update({ closeTime: date ? date.toISOString() : null })}
                        />
                        <span className='text-sm text-ink-500'>ระบบจะปิดรับโหวตอัตโนมัติเมื่อถึงเวลานี้</span>
                    </div>
                    <ImageInput label='รูปปกโพล' value={banner} onChange={setBanner} />
                </CardContent>
            </Card>
        </div>
    )
}
