'use client'
import React from 'react'
import { PollType, PollDetail, PollAddElement, PollTypeMore } from '@/components/create'

export function CreateContainer() {
    return (
        <div className=' flex flex-col gap-2'>
            <PollType />
            <PollDetail />
            <PollAddElement />
            <PollTypeMore/>
        </div>
    )
}
