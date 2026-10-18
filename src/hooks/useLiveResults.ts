'use client'
import { useEffect, useRef, useState } from 'react'

const POLL_INTERVAL = 5_000

// ดึงผลซ้ำทุก 5 วินาทีระหว่างโพลเปิดโหวต (backend มี ETag + cache 3 วินาที ผลไม่เปลี่ยนก็ตอบ 304 ราคาถูก)
// ข้ามรอบตอนแท็บไม่ได้เปิดดูอยู่ และหยุดเมื่อโพลปิดแล้ว (ผลไม่เปลี่ยนอีก)
export function useLiveResults<T>(initial: T, live: boolean, fetcher: (signal: AbortSignal) => Promise<T>) {
    const [results, setResults] = useState(initial)
    const fetcherRef = useRef(fetcher)
    useEffect(() => { fetcherRef.current = fetcher })

    useEffect(() => {
        if (!live) return
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
    }, [live])

    return results
}
