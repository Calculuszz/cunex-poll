import { useEffect, useRef, useState } from "react"

/**
 * คุมค่าช่องกรอกด้วย local state แล้วค่อย commit ลง store ตอนหยุดพิมพ์
 * เพราะ elementStore ต่อ persist ไว้ ถ้า commit ทุก keystroke = เขียน localStorage ทุกตัวอักษร
 */
export function useDebouncedField(
    value: string,
    commit: (next: string) => void,
    delay = 300,
) {
    const [draft, setDraft] = useState(value)

    const commitRef = useRef(commit)
    const draftRef = useRef(draft)
    const valueRef = useRef(value)

    useEffect(() => {
        commitRef.current = commit
        draftRef.current = draft
        valueRef.current = value
    })

    // ค่าจากข้างนอกเปลี่ยนเอง (store rehydrate, reset ฟอร์ม) ให้ดึงกลับมาที่ draft
    useEffect(() => {
        setDraft(value)
    }, [value])

    useEffect(() => {
        if (draft === value) return
        const timer = setTimeout(() => commitRef.current(draft), delay)
        return () => clearTimeout(timer)
    }, [draft, value, delay])

    // ถูก unmount ก่อน timer ทำงาน (กดลบ, เปลี่ยนหน้า) — ต้อง commit ทิ้งท้าย ไม่งั้นตัวที่พิมพ์ล่าสุดหาย
    useEffect(() => () => {
        if (draftRef.current !== valueRef.current) commitRef.current(draftRef.current)
    }, [])

    return [draft, setDraft] as const
}
