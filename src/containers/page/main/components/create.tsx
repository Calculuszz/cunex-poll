"use client"
import React from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from "lucide-react"
import Link from 'next/link'

export function CreateButton() {
    return (
        <Link href={"/create"}>
            <Button className={'text-lg font-bold font-heading fixed bottom-4 right-4'}>
                <Plus className='size-6'/>
                สร้างโพล
            </Button>
        </Link>
    )
}
