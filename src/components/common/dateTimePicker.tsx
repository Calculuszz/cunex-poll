"use client"

import * as React from "react"
import { format } from "date-fns"

import { DatePicker, formatThaiDate } from "@/components/common/datePicker"
import { TimeInput } from "@/components/common/timeInput"

/** Date → "HH:mm" สำหรับใส่ใน input type="time" */
function toTimeValue(date?: Date) {
  return date ? format(date, "HH:mm") : ""
}

/** รวมวันจาก picker กับเวลาจาก input ให้เป็น Date ก้อนเดียว */
function mergeDateAndTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  const merged = new Date(date)
  merged.setHours(hours || 0, minutes || 0, 0, 0)
  return merged
}

export function formatThaiDateTime(date: Date) {
  return `${formatThaiDate(date)} ${format(date, "HH:mm")} น.`
}

interface DateTimePickerProps {
  value?: Date
  onChange: (value: Date | undefined) => void
  /** เวลาที่เติมให้อัตโนมัติตอนเพิ่งเลือกวัน — ปิดโหวตสิ้นวันเป็นค่าที่ใช้บ่อยสุด */
  defaultTime?: string
  datePlaceholder?: string
  allowPast?: boolean
  disabled?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  defaultTime = "23:59",
  datePlaceholder = "เลือกวันที่",
  allowPast = false,
  disabled,
}: DateTimePickerProps) {
  const handleDateChange = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined)
      return
    }
    // เก็บเวลาเดิมไว้ถ้าเคยตั้งแล้ว จะได้ไม่โดนรีเซ็ตตอนเปลี่ยนวัน
    onChange(mergeDateAndTime(date, toTimeValue(value) || defaultTime))
  }

  const handleTimeChange = (time: string) => {
    if (!value || !time) return
    onChange(mergeDateAndTime(value, time))
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="sm:flex-1">
        <DatePicker
          date={value}
          setDate={handleDateChange}
          placeholder={datePlaceholder}
          allowPast={allowPast}
          disabled={disabled}
        />
      </div>
      <TimeInput
        value={toTimeValue(value)}
        onValueChange={handleTimeChange}
        disabled={disabled || !value}
        aria-label="เวลา"
        className="sm:w-36"
      />
    </div>
  )
}
