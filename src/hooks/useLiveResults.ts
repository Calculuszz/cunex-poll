'use client'
import { useEffect, useState } from 'react'

const POLL_INTERVAL = 5_000

// ยังไม่มี websocket/SSE ใน backend ชั่วคราว จึงดึงผลซ้ำทุก 5 วินาที
// ข้ามรอบตอนแท็บไม่ได้เปิดดูอยู่ และหยุดเมื่อโพลปิดแล้ว (ผลไม่เปลี่ยนอีก)
// ใช้ได้กับทั้งผลเต็มของเจ้าของและผลที่ผู้ตอบเห็น ขอแค่ payload มี status
export function useLiveResults<T extends { status: string }>(initial: T, url: string) {
    const [results, setResults] = useState(initial)
    const live = results.status === 'VOTING'

    useEffect(() => {
        if (!live) return
        let controller: AbortController | null = null
        const tick = async () => {
            if (document.hidden) return
            controller?.abort()
            controller = new AbortController()
            try {
                const res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
                if (res.ok) setResults(await res.json())
            } catch {
                // พลาดรอบเดียวไม่เป็นไร รอบถัดไปจะดึงใหม่
            }
        }
        const id = setInterval(tick, POLL_INTERVAL)
        return () => {
            clearInterval(id)
            controller?.abort()
        }
    }, [live, url])

    return results
}
