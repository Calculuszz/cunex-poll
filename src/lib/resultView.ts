// ตัวช่วยแสดงผลโหวตที่ใช้ร่วมกันทุกมุมมอง (รายการ / โดนัท / แท่ง)

export type ResultView = 'list' | 'pie' | 'bar'

// ลำดับคงที่เวลาแสดงหลายมุมมองพร้อมกัน
export const RESULT_VIEWS: ResultView[] = ['list', 'pie', 'bar']

export function parseViews(value: string | null | undefined): ResultView[] {
    const picked = (value ?? '').split(',').filter((v): v is ResultView => RESULT_VIEWS.includes(v as ResultView))
    return picked.length > 0 ? RESULT_VIEWS.filter((v) => picked.includes(v)) : ['list']
}

// ร้อยละเทียบจำนวนผู้ตอบข้อนั้น กันหารศูนย์ตอนยังไม่มีผู้ตอบ
export function percentOf(count: number, total: number) {
    return total === 0 ? 0 : (count / total) * 100
}

export const formatPercent = (pct: number) => `${pct.toFixed(1)}%`

export const formatCountPct = (count: number, total: number) =>
    `${count.toLocaleString('th-TH')} คน · ${formatPercent(percentOf(count, total))}`

// สีของตัวเลือกไล่จากชมพูเข้ม → อ่อนในพาเลตต์หลัก (rose) ตามลำดับตัวเลือก
// ใช้สีเดียวกันทุกมุมมอง ตัวเลือกเยอะก็ยังอยู่ในเฉดเดียว เพราะผสมระหว่างสองปลายด้วย color-mix
export function optionColor(index: number, total: number) {
    if (total <= 1) return 'var(--color-rose-700)'
    const t = Math.round((index / (total - 1)) * 100)
    return `color-mix(in oklch, var(--color-rose-900), var(--color-rose-300) ${t}%)`
}
