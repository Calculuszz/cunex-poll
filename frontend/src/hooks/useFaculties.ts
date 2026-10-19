'use client'
import { useEffect, useState } from 'react'
import { api } from '@/api'
import type { Faculty } from '@/api/types'

// รายชื่อคณะ (GET /faculties) ดึงครั้งเดียวต่อการเปิดเว็บ ใช้ร่วมกันทุก component
let cached: Promise<Faculty[]> | null = null

export function useFaculties(): Faculty[] | null {
    const [faculties, setFaculties] = useState<Faculty[] | null>(null)
    useEffect(() => {
        let alive = true
        cached ??= api.faculties().catch((err) => {
            cached = null
            throw err
        })
        cached.then((f) => { if (alive) setFaculties(f) }, () => {})
        return () => { alive = false }
    }, [])
    return faculties
}
