'use client'
import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DateTimePicker } from '@/components/common/dateTimePicker'
import { ImageInput } from '@/components/common/imageInput'

export function PollDetail() {
    const [closeTime, setCloseTime] = useState<Date>()
    const [banner, setBanner] = useState<string>()

    return (
        <div className=' flex flex-col gap-1'>
            <span className='text-xl font-heading font-bold'>ข้อมูลโพล</span>
            <Card>
                <CardContent className='flex flex-col gap-1'>
                    <div>
                        <Label className=' font-bold text-lg'>ชื่อโพล</Label>
                        <Input placeholder='ชื่อโพล...'/>
                    </div>
                    <div>
                        <Label className=' font-bold text-lg'>คำอธิบาย</Label>
                        <Textarea placeholder='คำอธิบายโพล...'/>
                    </div>
                    <div className='flex flex-col gap-1'>
                        <Label className=' font-bold text-lg'>เวลาปิดโพล</Label>
                        <DateTimePicker value={closeTime} onChange={setCloseTime} />
                        <span className='text-sm text-ink-500'>ระบบจะปิดรับโหวตอัตโนมัติเมื่อถึงเวลานี้</span>
                    </div>
                    <ImageInput label='รูปปกโพล' value={banner} onChange={setBanner} />
                </CardContent>
            </Card>
        </div>
    )
}
