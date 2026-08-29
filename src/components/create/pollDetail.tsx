'use client'
import React from 'react'
import { Label } from '../ui/label'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { DateTimePicker } from '@/components/common/dateTimePicker'

export function PollDetail() {
    const [closeTime, setCloseTime] = React.useState<Date>()

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
                </CardContent>
            </Card>
        </div>
    )
}
