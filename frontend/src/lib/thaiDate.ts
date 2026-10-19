// วันเวลาแบบไทย พ.ศ. ใช้ timeZone คงที่ให้ server กับ client ได้ข้อความเดียวกัน
// th-TH ใช้ปฏิทินพุทธศักราชอยู่แล้ว จึงได้ปี พ.ศ. โดยไม่ต้องบวก 543 เอง
const dateFormatter = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeZone: 'Asia/Bangkok' })
const timeFormatter = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' })

// "28 ส.ค. 2569 22:41 น."
export function formatThaiDateTime(date: Date | string) {
    const d = typeof date === 'string' ? new Date(date) : date
    return `${dateFormatter.format(d)} ${timeFormatter.format(d)} น.`
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// เวลาที่เหลือแบบหยาบสำหรับวงเล็บท้ายเวลาปิด: "อีก 3 วัน" / "อีก 5 ชม." / "อีก 12 นาที"
export function formatTimeLeftShort(close: Date | string, now: Date = new Date()) {
    const ms = new Date(close).getTime() - now.getTime()
    if (ms <= 0) return 'ปิดแล้ว'
    if (ms >= DAY) return `อีก ${Math.floor(ms / DAY)} วัน`
    if (ms >= HOUR) return `อีก ${Math.floor(ms / HOUR)} ชม.`
    return `อีก ${Math.max(1, Math.floor(ms / MINUTE))} นาที`
}

// ตัวนับถอยหลังละเอียดถึงนาที: "เหลือ 2 วัน 4 ชม. 15 นาที" คืน null เมื่อหมดเวลาแล้ว
export function formatCountdown(close: Date | string, now: Date = new Date()) {
    const ms = new Date(close).getTime() - now.getTime()
    if (ms <= 0) return null
    const days = Math.floor(ms / DAY)
    const hours = Math.floor((ms % DAY) / HOUR)
    const minutes = Math.floor((ms % HOUR) / MINUTE)
    return `เหลือ ${days} วัน ${hours} ชม. ${minutes} นาที`
}
