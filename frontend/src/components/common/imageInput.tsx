'use client'
import React, { useEffect, useId, useRef, useState } from 'react'
import { ImageUp, LoaderCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ImageFileError } from '@/lib/imageFile'
import { uploadImage } from '@/lib/imageUpload'

export function ImageInput({
    label = 'รูปภาพ',
    value,
    alt = '',
    onChange,
}: {
    label?: string
    value?: string
    alt?: string
    onChange: (next: string | undefined) => void
}) {
    const inputId = useId()
    const errorId = `${inputId}-error`
    const inputRef = useRef<HTMLInputElement>(null)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const requestRef = useRef<AbortController | null>(null)
    useEffect(() => () => requestRef.current?.abort(), [])

    const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return

        requestRef.current?.abort()
        const request = new AbortController()
        requestRef.current = request
        setBusy(true)
        setError(null)
        try {
            const next = await uploadImage(file, request.signal)
            if (!request.signal.aborted) onChange(next)
        } catch (err) {
            if (request.signal.aborted) return
            setError(err instanceof ImageFileError ? err.message : 'เพิ่มรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
        } finally {
            if (!request.signal.aborted) setBusy(false)
        }
    }

    const remove = () => {
        requestRef.current?.abort()
        setBusy(false)
        setError(null)
        onChange(undefined)
    }

    return (
        <div className='flex flex-col gap-2'>
            <Label htmlFor={inputId} className='text-lg font-bold'>{label}</Label>
            <input
                ref={inputRef}
                id={inputId}
                type='file'
                accept='image/*'
                className='peer sr-only'
                tabIndex={value ? -1 : undefined}
                disabled={busy}
                aria-describedby={error ? errorId : undefined}
                onChange={pick}
            />

            {value ? (
                <>
                    <div className='overflow-hidden rounded-lg border border-badge bg-inner-bg'>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={value} alt={alt} className='aspect-video w-full object-contain' />
                    </div>
                    <div className='flex gap-2'>
                        <Button
                            type='button'
                            variant='outline'
                            disabled={busy}
                            aria-busy={busy}
                            className='h-10 grow gap-2 rounded-input border-badge text-base font-bold text-ink-700'
                            onClick={() => inputRef.current?.click()}
                        >
                            {busy ? <LoaderCircle className='animate-spin' /> : <ImageUp />}
                            <span>เปลี่ยนรูป</span>
                        </Button>
                        <Button
                            type='button'
                            variant='ghost'
                            className='h-10 gap-2 rounded-input px-3 text-base font-bold text-ink-500 hover:bg-red-100 hover:text-red-200'
                            onClick={remove}
                        >
                            <Trash2 />
                            <span>ลบรูป</span>
                        </Button>
                    </div>
                </>
            ) : (
                <label
                    htmlFor={inputId}
                    aria-busy={busy}
                    className='flex h-30 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed text-base text-ink-500 transition-colors peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-disabled:cursor-progress'
                >
                    {busy ? <LoaderCircle className='size-5 animate-spin' /> : <ImageUp className='size-5' />}
                    {busy ? 'กำลังอัพโหลดรูป...' : 'แตะเพื่อเลือกรูป'}
                </label>
            )}

            {error ? (
                <span id={errorId} role='alert' className='text-sm text-red-200'>{error}</span>
            ) : null}
        </div>
    )
}
