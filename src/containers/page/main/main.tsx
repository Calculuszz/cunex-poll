import React from 'react'
import { PollSearch } from '@/components/common/search'
import { CreateButton } from '@/containers/page/main/components/create'
import { MainTabs } from '@/containers/widgets/tabs'

export function MainPage() {

    return (
        <div className=' relative flex flex-col gap-2'>
            <h1 className=' text-4xl font-bold font-heading'>โพลของคุณ</h1>
            <PollSearch />
            <MainTabs/>
            <div>
                {/*<PollCard data={}/>*/}
            </div>
            <CreateButton/>
        </div>
    )
}
