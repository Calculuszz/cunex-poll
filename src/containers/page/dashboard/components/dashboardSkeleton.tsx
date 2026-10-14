import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// เงาของการ์ดคำถาม: หัว "ข้อ n" + เส้นคั่น + ชื่อคำถาม + แถวตัวเลือก
function QuestionCardSkeleton() {
    return (
        <div className='flex flex-col gap-3 rounded-2xl border p-4'>
            <Skeleton className='h-6 w-12' />
            <Skeleton className='h-px w-full' />
            <Skeleton className='h-6 w-3/4' />
            <Skeleton className='h-4 w-1/3' />
            {[0, 1, 2].map((i) => (
                <div key={i} className='flex flex-col gap-1.5'>
                    <Skeleton className='h-5 w-1/2' />
                    <Skeleton className='h-2 w-full rounded-full' />
                </div>
            ))}
        </div>
    )
}

function ToggleBarSkeleton() {
    return (
        <div className='flex items-center justify-between'>
            <Skeleton className='h-11 w-42 rounded-lg' />
            <Skeleton className='h-5 w-24' />
        </div>
    )
}

export function DashboardSkeleton() {
    return (
        <div className='mx-auto flex w-full max-w-2xl flex-col gap-6 pb-8' aria-busy aria-label='กำลังโหลด'>
            <div className='flex flex-col gap-3'>
                <div className='flex gap-1.5'>
                    <Skeleton className='h-6 w-20 rounded-full' />
                    <Skeleton className='h-6 w-16 rounded-full' />
                </div>
                <Skeleton className='h-9 w-4/5' />
                <Skeleton className='h-9 w-1/2' />
            </div>
            <div className='flex flex-col gap-3'>
                {[0, 1, 2].map((i) => (
                    <div key={i} className='flex flex-col gap-1'>
                        <Skeleton className='h-4 w-20' />
                        <Skeleton className='ml-2 h-5 w-2/3' />
                    </div>
                ))}
            </div>
            <div className='flex gap-2'>
                {[0, 1, 2].map((i) => <Skeleton key={i} className='h-9 flex-1 rounded-full' />)}
            </div>
            <ToggleBarSkeleton />
            <QuestionCardSkeleton />
        </div>
    )
}

export function RealtimeSkeleton() {
    return (
        <div className='mx-auto flex w-full max-w-2xl flex-col gap-5 pb-8' aria-busy aria-label='กำลังโหลด'>
            <div className='flex flex-col gap-2'>
                <Skeleton className='h-9 w-4/5' />
                <Skeleton className='h-5 w-1/2' />
            </div>
            <Skeleton className='h-11 w-full rounded-lg' />
            <ToggleBarSkeleton />
            <QuestionCardSkeleton />
        </div>
    )
}
