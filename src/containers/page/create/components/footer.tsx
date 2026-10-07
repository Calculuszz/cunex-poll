'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Send, Eye, Download } from 'lucide-react'

export function CreateFooter() {
    return (
        <div className='flex flex-col gap-2 py-4 pb-8 items-start relative'>
            <div className=' absolute top-0 -left-4 w-screen h-full bg-ink-400/5 -z-1'/>
            <div className='text-ink-500 font-heading font-bold flex gap-1 items-center cursor-pointer underline'>
                <Download className='size-4'/>
                <span>บันทึกฉบับร่าง</span>
            </div>
            <div className='flex gap-1 w-full'>
                <Button className={`grow`}>
                    <Send/>
                    <span className='font-heading text-lg font-bold'>ส่งขออนุมัติ</span>
                </Button>
                <Button className={" aspect-square bg-yellow-500 "}><Eye/></Button>
            </div>
        </div>
    )
}
