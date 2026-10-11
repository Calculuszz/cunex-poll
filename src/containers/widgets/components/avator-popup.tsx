'use client'
import React from 'react'
import Avatar from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { User, Globe, UserStar, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useGuardedNavigate } from '@/hooks/useGuardedNavigate'

const studentID: number = 6734414223
const studentEmail:string = "6734414223@student.chula.ac.th"

function AvatarPopup() {
    const router = useRouter();
    const guard = useGuardedNavigate();
    return (
        <Popover>
            <PopoverTrigger>
                <Avatar variant={`secondary`} text='nano'/>
            </PopoverTrigger>
            <PopoverContent align='end' className={` w-60 overflow-hidden`}>
                <div>
                    <p className='text-xl font-bold font-heading leading-10'>เน็กกี้ เรียนดี</p>
                    <p className='text-sm leading-1.5 text-ink-500'>รหัส : {studentID}</p>
                    <p className='text-sm text-ink-500'>{studentEmail}</p>
                </div>
                <hr />
                <div className=' flex flex-col gap-1'>
                    <Link className='flex gap-1 items-start' href={'/'} onClick={(e) => guard('/', e)}>
                        <User className='size-5'/><span className='text-base font-bold'>โพลของฉัน</span>
                    </Link>
                    <Link className='flex gap-1 items-start' href={'/explore'} onClick={(e) => guard('/explore', e)}>
                        <Globe className='size-5'/><span className='text-base font-bold'>รวมโพล</span>
                    </Link>
                    <Link className='flex gap-1 items-start' href={'/admin'} onClick={(e) => guard('/admin', e)}>
                        <UserStar className='size-5'/><span className='text-base font-bold'>admin</span>
                    </Link>
                </div>
                <hr />
                <Button
                    onClick={() => { if (!guard('/login')) router.push("/login") }}
                    variant={'ghost'}
                    className={`text-base text-destructive font-bold`}
                >
                    <LogOut/>ออกจากระบบ
                </Button>
            </PopoverContent>
        </Popover>
    )
}

export default AvatarPopup
