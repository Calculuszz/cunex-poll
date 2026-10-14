'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bookmark, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { useCreatePollStore, type CodeKind } from '@/store/createPollStore'
import { useGuardedNavigate } from '@/hooks/useGuardedNavigate'
import { CODE_KIND_LABEL, CODE_PATTERNS, parseCodes } from './buildPayload'

export type PresetSummary = { id: number; name: string; codeKind: CodeKind; codes: string[] }

async function fetchPresets(): Promise<PresetSummary[]> {
    const res = await fetch('/api/presets')
    if (!res.ok) throw new Error('โหลด preset ไม่สำเร็จ')
    return res.json()
}

// เครื่องมือ preset ใต้ช่องรายการรหัส: เลือก preset ที่บันทึกไว้, บันทึกรหัสปัจจุบันเป็น preset, ไปหน้าจัดการ
export function PresetTools() {
    const text = useCreatePollStore((s) => s.codesText)
    const codeKind = useCreatePollStore((s) => s.codeKind)
    const update = useCreatePollStore((s) => s.update)
    const guard = useGuardedNavigate()

    const [presets, setPresets] = useState<PresetSummary[]>([])
    const [loadError, setLoadError] = useState<string | null>(null)
    const [pickedId, setPickedId] = useState('')
    const [saveOpen, setSaveOpen] = useState(false)

    const reloadPresets = () => {
        fetchPresets()
            .then((list) => { setPresets(list); setLoadError(null) })
            .catch(() => setLoadError('โหลด preset ไม่สำเร็จ'))
    }

    useEffect(() => { reloadPresets() }, [])

    const lines = parseCodes(text)
    const canSave = lines.length > 0 && lines.every((line) => CODE_PATTERNS[codeKind].test(line))
    const items = presets.map((p) => ({ label: `${p.name} · ${p.codes.length} รหัส`, value: String(p.id) }))

    return (
        <div className='flex flex-col gap-2 pt-1'>
            <div className='flex flex-wrap items-center gap-2'>
                <Button type='button' variant='outline' disabled={!canSave} onClick={() => setSaveOpen(true)}>
                    <Bookmark />
                    <span className='font-heading text-base font-bold'>save preset</span>
                </Button>
                <Link
                    href='/presets'
                    onClick={(e) => guard('/presets', e)}
                    className='text-base font-bold text-primary underline underline-offset-4'
                >
                    จัดการ preset
                </Link>
            </div>

            <div className='flex flex-col gap-1'>
                <Label className='font-bold text-base'>ใช้ preset ที่บันทึกไว้</Label>
                {loadError && <span role='alert' className='text-sm text-destructive'>{loadError}</span>}
                {!loadError && presets.length === 0 && <span className='text-sm text-ink-500'>ยังไม่มี preset</span>}
                {presets.length > 0 && (
                    <Select
                        items={items}
                        value={pickedId}
                        onValueChange={(v) => {
                            const preset = presets.find((p) => String(p.id) === v)
                            if (!preset) return
                            setPickedId(String(preset.id))
                            // ใช้ preset จะแทนรายการรหัสที่พิมพ์ค้างอยู่
                            update({ codeKind: preset.codeKind, codesText: preset.codes.join('\n') })
                        }}
                    >
                        <SelectTrigger className='w-full text-base h-10!'>
                            <SelectValue placeholder='เลือก preset' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {items.map((item) => (
                                    <SelectItem className='text-base' key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                )}
            </div>

            <SavePresetDialog
                open={saveOpen}
                onOpenChange={setSaveOpen}
                codeKind={codeKind}
                codes={lines}
                onSaved={reloadPresets}
            />
        </div>
    )
}

// dialog ตั้งชื่อ preset หน้าตาเดียวกับ dialog ยืนยันการส่งขออนุมัติ
function SavePresetDialog({ open, onOpenChange, codeKind, codes, onSaved }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    codeKind: CodeKind
    codes: string[]
    onSaved: () => void
}) {
    const [name, setName] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    const handleOpenChange = (next: boolean) => {
        if (pending) return
        onOpenChange(next)
        if (!next) {
            setName('')
            setError(null)
        }
    }

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            setError('ต้องตั้งชื่อ preset')
            return
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
            handleOpenChange(false)
            onSaved()
        } catch {
            setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง')
        } finally {
            setPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <form onSubmit={submit} className='flex w-full flex-col items-center pt-4'>
                    <Bookmark className='text-primary size-14' />
                    <DialogTitle className='font-heading text-xl py-6 font-bold'>บันทึกเป็น preset ?</DialogTitle>
                    <DialogDescription className='text-center text-base'>
                        ตั้งชื่อเพื่อเรียกใช้ซ้ำในโพลอื่น<br />preset นี้เห็นเฉพาะคุณ · {CODE_KIND_LABEL[codeKind]} {codes.length} รหัส
                    </DialogDescription>
                    <Input
                        className='my-4'
                        placeholder='ชื่อ preset...'
                        maxLength={60}
                        value={name}
                        aria-invalid={error !== null}
                        onChange={(e) => { setName(e.target.value); setError(null) }}
                    />
                    {error && <p role='alert' className='mb-2 text-base text-destructive'>{error}</p>}
                    <div className='flex w-full gap-2 py-4'>
                        <Button type='button' variant='outline' className='flex-1 font-heading text-base font-bold' disabled={pending} onClick={() => handleOpenChange(false)}>
                            ยกเลิก
                        </Button>
                        <Button type='submit' className='flex-1' disabled={pending} aria-busy={pending}>
                            {pending ? <Loader2 className='animate-spin' /> : <Bookmark />}
                            <span className='font-heading text-base font-bold'>บันทึก</span>
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
