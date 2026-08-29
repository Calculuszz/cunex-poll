"use client"
import React from 'react'
import { Button } from '../ui/button'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export function ReturnButton() {
    const pathName = usePathname();
    const router = useRouter();
    return (
        <Button onClick={() => router.back()} variant={'outline'} className={`font-heading font-bold pr-4 ${pathName !== "/" ? "flex" : "hidden"}`}>
            <ChevronLeft/>
            ย้อนกลับ
        </Button>
    )
}
