"use client"
import { useCallback } from "react"
import type React from "react"
import { usePathname } from "next/navigation"
import { useLeaveGuardStore } from "@/store/leaveGuardStore"

/**
 * ถ้าอยู่ที่หน้า create (รวมหน้าแก้ไขฉบับร่าง) แล้วจะไปที่อื่น ให้เปิด dialog เตือนก่อน แทนการเปลี่ยนหน้าทันที
 * คืน true เมื่อดักไว้แล้ว ผู้เรียกไม่ต้องไปต่อ
 */
export function useGuardedNavigate() {
    const pathname = usePathname()
    const request = useLeaveGuardStore((s) => s.request)

    return useCallback((href: string, event?: React.MouseEvent) => {
        if (pathname !== "/create" && !pathname.startsWith("/create/")) return false
        // ให้ Link ไม่เปลี่ยนหน้าเอง เพราะต้องรอผู้ใช้ยืนยันก่อน
        event?.preventDefault()
        request(href)
        return true
    }, [pathname, request])
}
