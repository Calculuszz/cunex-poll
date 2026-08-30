"use client"
import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"
import { Button } from '../ui/button'
import { useElementStore } from '@/store/elementStore'

export function ReturnButton() {
    const pathName = usePathname();
    const router = useRouter();
    const removeAll = useElementStore((s) => s.removeAll)
    if (pathName === "/create") {
        return (
            <>
                <Dialog>
                    <DialogTrigger>
                        <div className={`font-heading font-bold cursor-pointer flex`}>
                            <ChevronLeft className='size-7 text-primary'/>
                        </div>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className={'font-heading font-bold text-xl'}>Are you absolutely sure?</DialogTitle>
                            <DialogDescription className={`text-base`}>
                                This action cannot be undone. This will permanently delete your account
                                and remove your data from our servers.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className=' bg-transparent items-center '>
                            <DialogClose render={<Button variant={`ghost`} className={'font-heading font-bold text-sm px-4 py-5'}>ยกเลิก</Button>} />
                            <Button
                                onClick={() => {
                                    removeAll()
                                    router.back()
                                }}
                                className={' font-heading font-bold text-sm text-white px-4'}>
                                ย้อนกลับ
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        )
    }
    return (
        <div onClick={() => router.back()} className={`font-heading font-bold cursor-pointer ${pathName !== "/" ? "flex" : "hidden"}`}>
            <ChevronLeft className='size-7 text-primary'/>
        </div>
    )
}
