'use client'
import React, { useState } from 'react'
import { Label } from '../ui/label'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { DateTimePicker } from '@/components/common/dateTimePicker'
import { ImageUp } from "lucide-react"

export function PollDetail() {
    const [closeTime, setCloseTime] = useState<Date>()

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
                    <div className='flex flex-col gap-1'>
                        <Label className='font-bold text-lg'>อัพโหลดรูปภาพ</Label>
                        <div className='w-full relative '>
                            <input id='input-banner-image' className=' hidden' type='file' accept="image/*" />
                            <label htmlFor='input-banner-image' className='w-full h-30 bg-transparent border-2 border-dashed rounded-lg flex cursor-pointer items-center justify-center '>
                                <span className=' text-ink-400 text-base flex gap-2'>
                                    <ImageUp />
                                    อัพโหลดรูปภาพ
                                </span>
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
