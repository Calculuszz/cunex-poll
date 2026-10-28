"use client"

import * as React from "react"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
function toBuddhistYear(date: Date) {
  return date.getFullYear() + 543
}

export function formatThaiDate(date: Date) {
  return `${format(date, "d MMMM", { locale: th })} ${toBuddhistYear(date)}`
}

const thaiFormatters = {
  formatCaption: (month: Date) =>
    `${format(month, "LLLL", { locale: th })} ${toBuddhistYear(month)}`,
  formatYearDropdown: (year: Date) => String(toBuddhistYear(year)),
}

// ค่า default อ่านปีเป็น ค.ศ. ทั้งที่บนจอเป็น พ.ศ. — screen reader จะได้ยินคนละปีกับที่เห็น
const thaiLabels = {
  labelDayButton: (date: Date) =>
    `${format(date, "EEEEที่ d MMMM", { locale: th })} ${toBuddhistYear(date)}`,
  labelGrid: (month: Date) =>
    `${format(month, "LLLL", { locale: th })} ${toBuddhistYear(month)}`,
  labelPrevious: () => "เดือนก่อนหน้า",
  labelNext: () => "เดือนถัดไป",
}
function startOfToday() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

interface DatePickerProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  placeholder?: string
  allowPast?: boolean
  disabled?: boolean
  className?: string
  children?: React.ReactElement
}

export function DatePicker({
  date,
  setDate,
  placeholder = "เลือกวันที่",
  allowPast = false,
  disabled,
  className,
  children,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {children ? (
        <PopoverTrigger disabled={disabled} render={children} />
      ) : (
        <PopoverTrigger
          disabled={disabled}
          aria-label={
            date ? `วันที่เลือก ${formatThaiDate(date)}` : placeholder
          }
          className={cn(
            "flex min-h-[2.4rem] w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1",
            "text-base transition-colors md:text-sm dark:bg-input/30",
            "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            date ? "text-foreground" : "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {date ? formatThaiDate(date) : placeholder}
          </span>
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
      )}
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selected) => {
            setDate(selected)
            setOpen(false)
          }}
          defaultMonth={date}
          disabled={allowPast ? undefined : { before: startOfToday() }}
          locale={th}
          formatters={thaiFormatters}
          labels={thaiLabels}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
