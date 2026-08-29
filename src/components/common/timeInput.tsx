"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"

interface TimeInputProps extends Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "onChange"
> {
  /** รูปแบบ "HH:mm" — ค่าว่างคือยังไม่ได้เลือก */
  value: string
  onValueChange: (value: string) => void
}

/**
 * ช่องกรอกเวลาแบบ 24 ชม. ใช้ input type="time" ของเบราว์เซอร์
 * เพราะบนมือถือจะได้ตัวเลือกเวลาของระบบมาเลย ไม่ต้องเขียน picker เอง
 *
 * ไอคอนนาฬิกาปล่อยให้เป็นของเบราว์เซอร์ ไม่วาง lucide ทับ — การซ่อนของเดิม
 * ทำได้แค่ ::-webkit-calendar-picker-indicator ซึ่ง Firefox ไม่รองรับ
 * ผลคือ Firefox ขึ้นนาฬิกาสองอัน
 */
export function TimeInput({
  value,
  onValueChange,
  className,
  ...props
}: TimeInputProps) {
  return (
    <Input
      type="time"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      className={className}
      {...props}
    />
  )
}
