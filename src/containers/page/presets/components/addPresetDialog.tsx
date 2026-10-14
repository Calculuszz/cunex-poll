'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { CODE_KIND_LABEL, CODE_LENGTH, CODE_PATTERNS, parseCodes } from '@/containers/page/create/components/buildPayload'
import { PRESET_NAME_MAX, type PresetKind } from '@/lib/presetInput'

const CODE_KIND_ITEMS = [
    { label: 'นิสิต (10 หลัก)', value: 'STUDENT' },
    { label: 'บุคลากร (8 หลัก)', value: 'STAFF' },
]

// ปุ่มลอยมุมขวาล่างแบบเดียวกับ "เพิ่ม admin" เปิด dialog ให้ตั้งชื่อ เลือกประเภทรหัส และวางรายการรหัส
export function AddPresetDialog() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [codeKind, setCodeKind] = useState<PresetKind>('STUDENT')
    const [codesText, setCodesText] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    const codes = [...new Set(parseCodes(codesText))]
    const invalid = codes.filter((code) => !CODE_PATTERNS[codeKind].test(code))

    const handleOpenChange = (next: boolean) => {
        if (pending) return
        setOpen(next)
        if (!next) {
            setName('')
            setCodeKind('STUDENT')
            setCodesText('')
            setError(null)
        }
    }

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return setError('ต้องตั้งชื่อ preset')
        if (codes.length === 0) return setError('ต้องมีรหัสอย่างน้อยหนึ่งรหัส')
        if (invalid.length > 0) {
            return setError(`รหัส${CODE_KIND_LABEL[codeKind]}ต้องเป็นตัวเลข ${CODE_LENGTH[codeKind]} หลักทุกบรรทัด`)
        }
        setPending(true)
        setError(null)
        try {
            const res = await fetch('/api/presets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), codeKind, codes }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => null)
                setError(data?.error ?? 'บันทึก preset ไม่สำเร็จ')
                return
            }
            setPending(false)
            handleOpenChange(false)
            router.refresh()
        } catch {
            setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง')
        } finally {
            setPending(false)
        }
    }

    const placeholder = codeKind === 'STUDENT'
        ? '6400000001\n6400000002\n6400000003'
        : '12345678\n23456789\n34567890'

    return (
        <>
            <Button className='fixed bottom-4 right-4 px-4 font-heading text-lg font-bold' onClick={() => setOpen(true)}>
                <Plus className='size-5' />
                เพิ่ม preset
            </Button>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent>
                    <form onSubmit={submit} className='flex flex-col gap-4'>
                        <DialogHeader>
                            <DialogTitle className='font-heading text-xl font-bold'>เพิ่ม preset</DialogTitle>
                            <DialogDescription className='text-base'>บันทึกรายการรหัสไว้เลือกใช้ซ้ำตอนสร้างโพลแบบกำหนดจากรหัส</DialogDescription>
                        </DialogHeader>
                        <div className='flex flex-col gap-1'>
                            <Label htmlFor='preset-name' className='text-base font-bold'>ชื่อ preset</Label>
                            <Input
                                id='preset-name'
                                placeholder='ชื่อ preset...'
                                maxLength={PRESET_NAME_MAX}
                                value={name}
                                onChange={(e) => { setName(e.target.value); setError(null) }}
                            />
                        </div>
                        <div className='flex flex-col gap-1'>
                            <Label className='text-base font-bold'>ประเภทรหัส</Label>
                            <Select
                                items={CODE_KIND_ITEMS}
                                value={codeKind}
                                onValueChange={(v) => { if (v) { setCodeKind(v as PresetKind); setError(null) } }}
                            >
                                <SelectTrigger className='h-10! w-full text-base'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {CODE_KIND_ITEMS.map((item) => (
                                            <SelectItem key={item.value} value={item.value} className='text-base'>{item.label}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='flex flex-col gap-1'>
                            <Label htmlFor='preset-codes' className='text-base font-bold'>รายการรหัส{CODE_KIND_LABEL[codeKind]}</Label>
                            <Textarea
                                id='preset-codes'
                                rows={6}
                                placeholder={placeholder}
                                value={codesText}
                                aria-invalid={invalid.length > 0}
                                onChange={(e) => { setCodesText(e.target.value); setError(null) }}
                                className='max-h-60'
                            />
                            <span className='text-sm text-ink-500'>
                                ใส่รหัส {CODE_LENGTH[codeKind]} หลักหนึ่งรหัสต่อหนึ่งบรรทัด · {codes.length} รหัส
                                {invalid.length > 0 && <span className='text-destructive'> · ไม่ถูกรูปแบบ {invalid.length} รายการ</span>}
                            </span>
                        </div>
                        {error && <p role='alert' className='text-base text-destructive'>{error}</p>}
                        <DialogFooter>
                            <Button type='button' variant='outline' disabled={pending} className='w-26 font-heading font-bold' onClick={() => handleOpenChange(false)}>ยกเลิก</Button>
                            <Button type='submit' disabled={pending} aria-busy={pending} className='w-26 font-heading font-bold'>
                                {pending && <Loader2 className='animate-spin' />}
                                บันทึก
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
