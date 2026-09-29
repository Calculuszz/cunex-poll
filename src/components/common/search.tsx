"use client"
import React from 'react'
import { Input } from '../ui/input'
import { Search } from "lucide-react"

export function PollSearch() {
    return (
        <div className=' py-2 relative'>
            <Search size={20} className='absolute top-1/2 -translate-y-1/2 left-2 text-ink-400'/>
            <Input placeholder='ค้นหา...' className='pl-8 h-10 text-lg! max-w-100'/>
        </div>
    )
}
