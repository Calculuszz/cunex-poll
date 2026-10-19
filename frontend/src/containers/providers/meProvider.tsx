'use client'
import React, { createContext, useContext, type ReactNode } from 'react'
import type { Me } from '@/api/types'

// ผู้ใช้ปัจจุบัน (GET /me) โหลดครั้งเดียวที่ root layout ฝั่ง server แล้วส่งให้ client component ใช้ร่วมกัน
// null = ยังไม่ล็อกอิน (หน้า login)
const MeContext = createContext<Me | null>(null)

export function MeProvider({ me, children }: { me: Me | null; children: ReactNode }) {
    return <MeContext.Provider value={me}>{children}</MeContext.Provider>
}

export const useMe = () => useContext(MeContext)
