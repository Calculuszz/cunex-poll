"use client"
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { Bookmark, Compass, Plus } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ปุ่มเมนูมุมขวาล่าง: กดแล้วปุ่ม "สร้างโพล" "จัดการ preset" และ "โพลที่ตอบได้" เด้งออกมาทีละปุ่ม
// ปิดได้ด้วยกดปุ่มเมนูอีกครั้ง คลิกนอกเมนู หรือกด Escape
export function CreateMenu() {
    const [open, setOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    // หมุนเฉพาะไอคอนบวกให้กลายเป็นกากบาทตอนเปิด
    const iconRef = useRef<HTMLSpanElement>(null)
    const itemsRef = useRef<HTMLDivElement>(null)
    const timeline = useRef<gsap.core.Timeline | null>(null)

    // สร้าง timeline ครั้งเดียว เล่นไปข้างหน้าตอนเปิด และเล่นย้อนตอนปิด
    useEffect(() => {
        const items = itemsRef.current?.children
        if (!items || !iconRef.current) return
        const ctx = gsap.context(() => {
            // ขยับแค่ transform/opacity, ไม่มี overshoot และให้ปุ่มที่อยู่ใกล้ปุ่มเมนูขึ้นก่อน (stagger from end)
            // ปุ่มย่อขยายจากมุมขวาล่างให้ดูเหมือนงอกออกมาจากปุ่มเมนู
            // y ต้องไม่เกินช่องว่าง gap-2 (8px) ไม่งั้นระหว่าง animation ปุ่มย่อยจะทับปุ่มเมนูแล้วรับคลิกแทน
            gsap.set(items, { transformOrigin: 'right bottom', force3D: true })
            timeline.current = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })
                .fromTo(
                    items,
                    { y: 8, opacity: 0, scale: 0.8 },
                    { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: { each: 0.07, from: 'end' } },
                    0,
                )
                .to(iconRef.current, { rotate: 135, duration: 0.5 }, 0)
        }, rootRef)
        return () => {
            timeline.current = null
            ctx.revert()
        }
    }, [])

    // คนที่ตั้งค่าลดการเคลื่อนไหวไว้ให้เปลี่ยนสถานะทันที ไม่เล่น animation
    const play = (next: boolean) => {
        const tl = timeline.current
        if (!tl) return
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduce) tl.progress(next ? 1 : 0)
        // ตอนปิดเล่นเร็วขึ้น ของที่หายไปควรเร็วกว่าของที่โผล่มา
        else if (next) tl.timeScale(1).play()
        else tl.timeScale(1.6).reverse()
    }

    const toggle = () => {
        const next = !open
        setOpen(next)
        play(next)
    }

    const close = () => {
        if (!open) return
        setOpen(false)
        play(false)
    }

    useEffect(() => {
        if (!open) return
        const onPointerDown = (e: PointerEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) close()
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close()
        }
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
        // close ใช้ state ปัจจุบันเท่านั้น จึงผูกกับ open พอ
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    // พื้นทึบ + เงาบาง เพราะปุ่มลอยทับการ์ดโพล ถ้าโปร่งจะเห็นตัวอักษรด้านหลังซ้อนกัน
    // buttonVariants มี transition-all กับ active:translate-y-px ซึ่งจะไปไล่ค่า opacity/transform ที่ GSAP ตั้งทุกเฟรมซ้อนอีกชั้น
    // จึงเหลือ transition เฉพาะสี (hover) และตัดการขยับตอนกด ให้ GSAP คุม transform/opacity ฝ่ายเดียว
    const itemClass = cn(
        buttonVariants({ variant: 'outline' }),
        'rounded-full bg-background px-4 py-5 text-lg font-bold font-heading shadow-sm',
        'transition-colors active:not-aria-[haspopup]:translate-y-0',
    )

    return (
        <div ref={rootRef} className='fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2'>
            {/* inert ตอนปิด เพื่อไม่ให้กดหรือโฟกัสปุ่มที่มองไม่เห็น */}
            <div ref={itemsRef} id='create-menu' inert={!open} className='flex flex-col items-end gap-2'>
                <Link href='/create' className={itemClass} onClick={close}>
                    <Plus className='size-5' />
                    สร้างโพล
                </Link>
                <Link href='/presets' className={itemClass} onClick={close}>
                    <Bookmark className='size-5' />
                    จัดการ preset
                </Link>
                <Link href='/explore' className={itemClass} onClick={close}>
                    <Compass className='size-5' />
                    โพลที่ตอบได้
                </Link>
            </div>
            <Button
                type='button'
                size='icon'
                aria-label={open ? 'ปิดเมนู' : 'เปิดเมนู'}
                aria-expanded={open}
                aria-controls='create-menu'
                className='size-14 py-0'
                onClick={toggle}
            >
                <span ref={iconRef} className='inline-flex'>
                    <Plus className='size-7' />
                </span>
            </Button>
        </div>
    )
}
