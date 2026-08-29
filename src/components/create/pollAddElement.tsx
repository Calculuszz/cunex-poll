'use client'
import React from 'react'
import { Button } from '../ui/button'
import { Plus } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { QuestionList, ElementList } from './constant'


export function PollAddElement() {
    return (
        <div className=' flex flex-col gap-1'>
            <span className=' text-xl font-heading font-bold'>คำถามและองค์ประกอบ</span>
            <Dialog>
                <DialogTrigger render={<Button className={'w-full'} />}>
                    <Plus/>
                    <span className='text-lg'>เพิ่มคำถามหรือองค์ประกอบ</span>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader className=' font-heading text-ink-500 text-lg font-bold'>คำถาม</DialogHeader>
                    <div className=' grid grid-cols-2 gap-2'>
                        {QuestionList.map((item, index) => {
                            const Icon = item.icon
                            return (
                                <DialogClose key={`button-${index}`} render={
                                    <Button className={` rounded-xl border-badge font-bold text-black gap-2 text-base justify-start`} variant={`outline`}>
                                        <Icon />
                                        <span>{item.title}</span>
                                    </Button>
                                } />
                            )
                        })}
                    </div>
                    <DialogHeader className=' font-heading text-ink-500 text-lg font-bold'>องค์ประกอบ</DialogHeader>
                    <div className=' grid grid-cols-2 gap-2'>
                        {ElementList.map((item, index) => {
                            const Icon = item.icon
                            return (
                                <DialogClose key={`button-${index}`} render={
                                    <Button className={` rounded-xl border-badge font-bold text-black gap-2 text-base justify-start`} variant={`outline`}>
                                        <Icon />
                                        <span>{item.title}</span>
                                    </Button>
                                } />
                            )
                        })}
                    </div>
                    <DialogFooter>
                        <DialogClose render={<Button className={` px-6 py-4 text-base font-bold font-heading`}>ปิด</Button>}/>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
