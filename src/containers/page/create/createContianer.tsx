'use client'
import React from 'react'
import { PollType, PollDetail, PollTypeMore } from '@/containers/page/create/components'
import { ElementContainer } from "./elementContainer"

export function CreateContainer() {
    return (
        <div className=' flex flex-col gap-2'>
            <PollType />
            <PollDetail />
            <ElementContainer />
            <PollTypeMore/>
        </div>
    )
}
