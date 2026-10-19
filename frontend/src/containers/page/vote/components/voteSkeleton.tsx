import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// เงาของแถบบน (ลิงก์ซ้าย + avatar ขวา)
function HeaderSkeleton() {
    return (
        <div className='-mx-4 mb-4 flex h-16 items-center justify-between border-b px-4'>
            <Skeleton className='h-5 w-40' />
            <Skeleton className='size-12 rounded-full' />
        </div>
    )
}

export function IntroSkeleton() {
    return (
        <div aria-busy aria-label='กำลังโหลด'>
            <HeaderSkeleton />
            <div className='flex flex-col gap-4 rounded-2xl border p-4'>
                <Skeleton className='h-9 w-4/5' />
                <Skeleton className='h-9 w-1/2' />
                {[0, 1, 2].map((i) => (
                    <div key={i} className='flex flex-col gap-1'>
                        <Skeleton className='h-4 w-20' />
                        <Skeleton className='ml-2 h-5 w-2/3' />
                    </div>
                ))}
                <Skeleton className='h-16 w-full' />
                <Skeleton className='h-11 w-full rounded-full' />
            </div>
        </div>
    )
}

export function StepSkeleton() {
    return (
        <div aria-busy aria-label='กำลังโหลด'>
            <HeaderSkeleton />
            <Skeleton className='h-4 w-24' />
            <Skeleton className='mt-1.5 h-1.5 w-full rounded-full' />
            <div className='flex flex-col gap-3 pt-6'>
                <Skeleton className='h-5 w-12' />
                <Skeleton className='h-7 w-3/4' />
                <Skeleton className='h-4 w-32' />
                {[0, 1, 2].map((i) => <Skeleton key={i} className='h-15 w-full rounded-xl' />)}
            </div>
        </div>
    )
}
