'use client'
import React from 'react'
import Link from 'next/link'

export function AdminHeading() {
    return (
        <div className='flex gap-2 items-end'>
            <h1 className="  text-4xl font-bold font-heading">ผู้ดูแลระบบ</h1>
            <Link className='underline text-base text-ink-500 -translate-y-1 cursor-pointer' href={"/"}>จัดการผู้ดูแลระบบ</Link>
        </div>
    )
}
