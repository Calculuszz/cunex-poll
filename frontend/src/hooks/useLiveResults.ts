'use client'
import { useEffect, useRef, useState } from 'react'

const POLL_INTERVAL = 5_000

// ดึงผลซ้ำทุก 5 วินาทีระหว่างโพลเปิดโหวต (backend มี ETag + cache 3 วินาที ผลไม่เปลี่ยนก็ตอบ 304 ราคาถูก)
// ข้ามรอบตอนแท็บไม่ได้เปิดดูอยู่ และหยุดเมื่อผลที่ดึงมาบอกว่าโพลปิดแล้ว (ผลไม่เปลี่ยนอีก ไม่ต้องเปลืองโควตา)
export function useLiveResults<T extends { status: string }>(initial: T, live: boolean, fetcher: (signal: AbortSignal) => Promise<T>) {
    const [results, setResults] = useState(initial)
    const stillOpen = results.status === 'open'
    const fetcherRef = useRef(fetcher)
    useEffect(() => { fetcherRef.current = fetcher })

    useEffect(() => {
        if (!live || !stillOpen) return
        let controller: AbortController | null = null
        const tick = async () => {
            if (document.hidden) return
            controller?.abort()
            controller = new AbortController()
            try {
                setResults(await fetcherRef.current(controller.signal))
            } catch {
                // พลาดรอบเดียวไม่เป็นไร รอบถัดไปจะดึงใหม่
            }
        }
        const id = setInterval(tick, POLL_INTERVAL)
        return () => {
            clearInterval(id)
            controller?.abort()
        }
    }, [live, stillOpen])

    return results
}
