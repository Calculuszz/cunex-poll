'use client'
import React from 'react'
import { ChartColumnBig, ChartPie, GitCompareArrows, List } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { RESULT_VIEWS, type ResultView } from '@/lib/resultView'

const ITEMS: { value: ResultView; label: string; Icon: typeof List }[] = [
    { value: 'list', label: 'มุมมองรายการ', Icon: List },
    { value: 'pie', label: 'แผนภูมิวงกลม', Icon: ChartPie },
    { value: 'bar', label: 'แผนภูมิแท่ง', Icon: ChartColumnBig },
]

// เลือกมุมมองผลโหวตได้หลายแบบพร้อมกัน แต่ต้องเหลืออย่างน้อยหนึ่งแบบเสมอ
// ปุ่มเปรียบเทียบยังไม่เปิดใช้ จองช่องไว้สำหรับฟีเจอร์ถัดไป (หน้าตั้งค่าการเผยแพร่ไม่ใช้ จึงปิดได้ด้วย compare={false})
export function ViewToggleBar({ views, onChange, total, compare = true }: {
    views: ResultView[]
    onChange: (views: ResultView[]) => void
    total?: number
    compare?: boolean
}) {
    const item = 'size-9 rounded-md text-ink-900 hover:bg-inner-bg aria-pressed:bg-primary aria-pressed:text-primary-foreground [&_svg:not([class*=size-])]:size-5'
    return (
        <div className='flex items-center justify-between gap-2'>
            <ToggleGroup
                multiple
                value={views}
                onValueChange={(next) => {
                    const picked = RESULT_VIEWS.filter((v) => next.includes(v))
                    if (picked.length > 0) onChange(picked)
                }}
                spacing={1}
                className='rounded-lg border p-1'
                aria-label='มุมมองผลโหวต'
            >
                {ITEMS.map(({ value, label, Icon }) => (
                    <ToggleGroupItem key={value} value={value} aria-label={label} className={item}>
                        <Icon />
                    </ToggleGroupItem>
                ))}
                {compare && (
                    <ToggleGroupItem value='compare' aria-label='เปรียบเทียบ (เร็วๆ นี้)' disabled className={item}>
                        <GitCompareArrows />
                    </ToggleGroupItem>
                )}
            </ToggleGroup>
            {total !== undefined && <span className='text-base font-semibold text-ink-500'>ตอบแล้ว {total.toLocaleString('th-TH')} คน</span>}
        </div>
    )
}
