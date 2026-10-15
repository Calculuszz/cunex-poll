'use client'
import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { groupLabel, type AudienceScope } from '@/lib/audienceLabel'

// ย่อเมื่อเลือกตั้งแต่ 3 คณะขึ้นไป (System flow §3)
const COLLAPSE_AT = 3

// ขอบเขตผู้ตอบในหน้า dashboard และหน้ากรอก
// แบบ B: 1–2 คณะแสดงเต็มบรรทัดละคณะ · 3+ ย่อเป็น "คณะ X, คณะ Y และอีก n คณะ" + ปุ่มดูรายชื่อเปิด dialog จัดกลุ่มตามคณะ
// แบบอื่นใช้ป้ายบรรทัดเดียว (label)
export function AudienceScopeView({ label, scope }: { label: string; scope: AudienceScope | null }) {
    const [open, setOpen] = useState(false)

    if (!scope || scope.groups.length === 0) return <>{label}</>

    if (scope.facultyCount < COLLAPSE_AT) {
        return (
            <span className='flex flex-col'>
                {scope.groups.map((g) => <span key={g.faculty}>{groupLabel(g)}</span>)}
            </span>
        )
    }

    const [first, second] = scope.groups
    return (
        <span className='flex flex-col items-start'>
            <span>{first.faculty}, {second.faculty} และอีก {scope.facultyCount - 2} คณะ</span>
            <span className='flex flex-wrap items-center gap-x-2 text-sm text-ink-500'>
                รวม {scope.facultyCount} คณะ · {scope.departmentCount} สาขา
                <button
                    type='button'
                    onClick={() => setOpen(true)}
                    className='rounded-sm font-bold text-primary underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
                >
                    ดูรายชื่อ
                </button>
            </span>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className='font-heading text-xl font-bold'>ขอบเขตผู้ตอบ</DialogTitle>
                        <DialogDescription className='text-base'>
                            รวม {scope.facultyCount} คณะ · {scope.departmentCount} สาขา
                        </DialogDescription>
                    </DialogHeader>
                    {/* คณะเป็นหัวข้อ สาขาเป็นชิปข้างใต้ ชื่อคณะจะได้ไม่ซ้ำหลายรอบ */}
                    <ul className='flex flex-col gap-3'>
                        {scope.groups.map((g) => (
                            <li key={g.faculty} className='flex flex-col gap-1'>
                                <span className='text-base font-bold'>{g.faculty}</span>
                                <span className='flex flex-wrap gap-1'>
                                    {g.whole
                                        ? <Badge variant='outline'>ทั้งคณะ</Badge>
                                        : g.departments.map((d) => <Badge key={d} variant='outline'>{d}</Badge>)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </DialogContent>
            </Dialog>
        </span>
    )
}
