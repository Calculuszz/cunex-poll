import React from 'react'
import { PollSearch } from '@/components/common/search'
import { CreateButton } from '@/containers/page/main/components/create'
import { MainTabs } from '@/containers/widgets/tabs'

export function ExplorePage() {
    return (
        <div className=' relative flex flex-col gap-2'>
            <h1 className=' text-4xl font-bold font-heading'>โพลที่กรอกได้</h1>
            <PollSearch />
            <div>
                {/*<PollCard data={}/>*/}
            </div>
        </div>
    )
}
