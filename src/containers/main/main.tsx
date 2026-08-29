import React from 'react'
import { PollSearch } from '@/components/main/search'
import { CreateButton } from '@/components/main/create'

export function MainPage() {

    return (
        <div className=' relative'>
            <h1 className=' text-4xl font-bold font-heading'>โพลของคุณ</h1>
            <PollSearch />
            <div>
                {/*<PollCard data={}/>*/}
            </div>
            <CreateButton/>
        </div>
    )
}
