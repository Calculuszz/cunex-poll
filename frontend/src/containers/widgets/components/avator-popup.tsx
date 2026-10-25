'use client'
import React from 'react'
import Avatar from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { User, Globe, UserStar, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useGuardedNavigate } from '@/hooks/useGuardedNavigate'
import { useMe } from '@/containers/providers/meProvider'

// เมนูโปรไฟล์: ข้อมูลจาก GET /me · เมนู admin โชว์เฉพาะ role admin (หน้าแอดมินกันซ้ำที่ server และ API)
function AvatarPopup() {
    const router = useRouter()
    const guard = useGuardedNavigate()
    const me = useMe()
    const go = (href: string) => { if (!guard(href)) router.push(href) }

    const title = me?.studentId ? `รหัส ${me.studentId}` : 'ผู้ใช้ CUNEX'
    const detail = me?.faculty
        ? `คณะ${me.faculty.nameTh}${me.studentYear ? ` · ปีเข้า ${me.studentYear}` : ''}`
        : 'ไม่มีข้อมูลคณะ'

    return (
        <Popover>
            <PopoverTrigger aria-label='เมนูผู้ใช้'>
                <Avatar variant={`secondary`} text={me?.studentId ?? (me ? 'G' : undefined)}/>
            </PopoverTrigger>
            <PopoverContent align='end' className={` w-60 overflow-hidden`}>
                <div>
                    <p className='text-xl font-bold font-heading leading-10'>{title}</p>
                    <p className='text-sm text-ink-500'>{detail}</p>
                    {me?.role === 'admin' && <p className='text-sm text-ink-500'>ผู้ดูแลระบบ</p>}
                </div>
                <hr />
                <div className=' flex flex-col gap-1'>
                    <Link className='flex gap-1 items-start' href={'/'} onClick={(e) => guard('/', e)}>
                        <User className='size-5'/><span className='text-base font-bold'>โพลของฉัน</span>
                    </Link>
                    <Link className='flex gap-1 items-start' href={'/explore'} onClick={(e) => guard('/explore', e)}>
                        <Globe className='size-5'/><span className='text-base font-bold'>รวมโพล</span>
                    </Link>
                    {me?.role === 'admin' && (
                        <Link className='flex gap-1 items-start' href={'/admin'} onClick={(e) => guard('/admin', e)}>
                            <UserStar className='size-5'/><span className='text-base font-bold'>admin</span>
                        </Link>
                    )}
                </div>
                <hr />
                <Button onClick={() => go('/logout')} variant={'ghost'} className={`text-base text-destructive font-bold`}>
                    <LogOut/>ออกจากระบบ
                </Button>
            </PopoverContent>
        </Popover>
    )
}

export default AvatarPopup
