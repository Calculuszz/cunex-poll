'use client'
import React from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { ElementItem } from '@/store/elementStore'

// element ส่วนแสดงผลของฟอร์ม (API contract §3) ชนิดที่ยังไม่รู้จักให้ข้ามไป ไม่ใช่พังทั้งหน้า
// รูปมาจากลิงก์/data URL ที่ผู้สร้างใส่ โดเมนไม่แน่นอนจึงใช้ img ธรรมดา
export function ElementView({ item }: { item: ElementItem }) {
    switch (item.type) {
        case 'text':
            return (
                <div className='flex flex-col gap-1'>
                    {item.title && <h3 className='font-heading text-lg font-bold'>{item.title}</h3>}
                    <p className='break-words whitespace-pre-line'>{item.body}</p>
                </div>
            )
        case 'image':
            return (
                <figure className='flex flex-col gap-1'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.alt ?? ''} loading='lazy' className='w-full rounded-xl object-contain' />
                    {item.caption && <figcaption className='text-center text-sm text-ink-500'>{item.caption}</figcaption>}
                </figure>
            )
        case 'accordion':
            return (
                <Accordion className='rounded-xl border px-3'>
                    <AccordionItem value='body'>
                        <AccordionTrigger className='font-heading text-base font-bold'>{item.title}</AccordionTrigger>
                        <AccordionContent className='text-base break-words whitespace-pre-line'>{item.body}</AccordionContent>
                    </AccordionItem>
                </Accordion>
            )
        case 'dialog':
            return (
                <Dialog>
                    <DialogTrigger render={<Button variant='outline' className='h-11 w-full rounded-full font-heading text-base font-bold' />}>
                        {item.trigger || 'ดูข้อมูลเพิ่มเติม'}
                    </DialogTrigger>
                    <DialogContent className='flex max-h-[85vh] flex-col gap-3 overflow-y-auto'>
                        <DialogTitle className='font-heading text-xl font-bold'>{item.title}</DialogTitle>
                        {item.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt='' loading='lazy' className='w-full rounded-xl object-contain' />
                        )}
                        <DialogDescription className='text-base break-words whitespace-pre-line text-foreground'>{item.body}</DialogDescription>
                    </DialogContent>
                </Dialog>
            )
        default:
            return null
    }
}
