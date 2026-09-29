import React, { type ReactNode } from 'react'
import { Navbar } from '../widgets/navbar'

export function AdminLayout({ children }: { children: ReactNode}) {
    return (
        <div className='w-full flex flex-col min-h-screen'>
            <Navbar />
            <div className=' grow px-6'>
                {children}
            </div>
        </div>
    )
}
