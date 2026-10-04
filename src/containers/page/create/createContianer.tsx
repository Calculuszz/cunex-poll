'use client'
import React from 'react'
import { PollType, PollDetail, PollTypeMore, CreateFooter } from '@/containers/page/create/components'
import { ElementContainer } from "./elementContainer"

export function CreateContainer() {
    return (
        <div className=' flex flex-col gap-2'>
            <PollType />
            <PollDetail />
            <ElementContainer />
            <PollTypeMore />
            <CreateFooter/>
        </div>
    )
}
