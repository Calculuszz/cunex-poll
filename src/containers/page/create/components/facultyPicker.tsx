'use client'
import React, { useId, useState } from 'react'
import { Combobox } from '@base-ui/react/combobox'
import { CheckIcon, XIcon } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { AudienceRule, Department } from '@/api/types'
import { useDebouncedField } from '@/hooks/useDebouncedField'
import { useFaculties } from '@/hooks/useFaculties'
import { useCreatePollStore } from '@/store/createPollStore'

type FacultyItem = { code: string; label: string }

// ปีเข้า (พ.ศ.) ที่เลือกได้: ปีนี้ย้อนไป 7 ปี ครอบคลุมนิสิตที่ยังเรียนอยู่เกือบทั้งหมด
const YEAR_SPAN = 8

// ขอบเขตแบบ restricted: เลือกคณะ แล้วแต่ละคณะจำกัดสาขาและ/หรือปีเข้าได้
// เก็บเป็นกฎ { facultyCode, departmentCode, studentYear } (null = ทั้งคณะ / ทุกปีเข้า) หนึ่งกฎต่อหนึ่งคู่ สาขา × ปีเข้า
export function FacultyPicker() {
    const inputId = useId()
    const faculties = useFaculties()
    const rules = useCreatePollStore((s) => s.rules)
    const update = useCreatePollStore((s) => s.update)
    const [query, setQuery] = useState('')
    const [inputValue, setInputValue] = useDebouncedField(query, setQuery)

    const items: FacultyItem[] = (faculties ?? []).map((f) => ({ code: f.code, label: `คณะ${f.nameTh}` }))
    const codes = [...new Set(rules.map((r) => r.facultyCode))]
    const selected = items.filter((item) => codes.includes(item.code))
    const keyword = query.trim().toLowerCase()
    const visibleItems = keyword ? items.filter((item) => item.label.toLowerCase().includes(keyword)) : items

    // คณะที่เพิ่งเลือกเริ่มที่ทุกปีเข้า · คณะที่เอาออกตัดกฎของคณะนั้นทิ้งทั้งหมด
    const handleChange = (next: FacultyItem[]) => {
        const nextCodes = next.map((i) => i.code)
        const kept = rules.filter((r) => nextCodes.includes(r.facultyCode))
        const added = nextCodes.filter((c) => !codes.includes(c)).map((facultyCode): AudienceRule => ({ facultyCode, departmentCode: null, studentYear: null }))
        update({ rules: [...kept, ...added] })
    }

    // สาขา × ปีเข้า ของหนึ่งคณะ → กฎ (null ฝั่งไหน = ไม่จำกัดฝั่งนั้น)
    const setScope = (facultyCode: string, depts: string[] | null, years: number[] | null) => {
        const others = rules.filter((r) => r.facultyCode !== facultyCode)
        const mine = (depts ?? [null]).flatMap((departmentCode) =>
            (years ?? [null]).map((studentYear): AudienceRule => ({ facultyCode, departmentCode, studentYear })))
        update({ rules: [...others, ...mine] })
    }

    return (
        <div className='flex flex-col gap-2 mt-2'>
            <div className='flex flex-col gap-1'>
                <Label htmlFor={inputId} className='font-bold text-base'>คณะ</Label>
                <Combobox.Root
                    items={visibleItems}
                    filter={null}
                    multiple
                    value={selected}
                    onValueChange={handleChange}
                    inputValue={inputValue}
                    onInputValueChange={setInputValue}
                    itemToStringLabel={(item) => item.label}
                    isItemEqualToValue={(a, b) => a.code === b.code}
                >
                    <Combobox.InputGroup className='flex min-h-8 w-full flex-wrap items-center rounded-lg border border-input bg-transparent px-2 py-1 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30'>
                        <Combobox.Chips className='flex w-full flex-wrap items-center gap-1'>
                            <Combobox.Value>
                                {(value: FacultyItem[]) => (
                                    <React.Fragment>
                                        {value.map((item) => (
                                            <Combobox.Chip
                                                key={item.code}
                                                aria-label={item.label}
                                                className='flex min-h-6 items-center gap-1 rounded-md bg-secondary py-0 pr-1 pl-2 text-sm text-secondary-foreground'
                                            >
                                                {item.label}
                                                <Combobox.ChipRemove
                                                    aria-label={`ลบ ${item.label}`}
                                                    className='flex size-4 items-center justify-center rounded-sm hover:bg-foreground/10'
                                                >
                                                    <XIcon className='size-3' />
                                                </Combobox.ChipRemove>
                                            </Combobox.Chip>
                                        ))}
                                        <Combobox.Input
                                            id={inputId}
                                            placeholder={value.length > 0 ? '' : 'พิมพ์เพื่อค้นหาคณะ'}
                                            className='h-6 min-w-24 flex-1 border-0 bg-transparent p-0 text-base outline-none placeholder:text-muted-foreground md:text-sm'
                                        />
                                    </React.Fragment>
                                )}
                            </Combobox.Value>
                        </Combobox.Chips>
                    </Combobox.InputGroup>
                    <Combobox.Portal>
                        <Combobox.Positioner className='z-50 outline-none' sideOffset={4}>
                            <Combobox.Popup className='max-h-(--available-height) w-(--anchor-width) overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10'>
                                <Combobox.Empty>
                                    <div className='px-2 py-1.5 text-sm text-ink-500'>ไม่พบคณะ</div>
                                </Combobox.Empty>
                                <Combobox.List>
                                    {(item: FacultyItem) => (
                                        <Combobox.Item
                                            key={item.code}
                                            value={item}
                                            className='grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-md px-2 py-1.5 text-base outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground'
                                        >
                                            <Combobox.ItemIndicator className='col-start-1'>
                                                <CheckIcon className='size-4' />
                                            </Combobox.ItemIndicator>
                                            <span className='col-start-2'>{item.label}</span>
                                        </Combobox.Item>
                                    )}
                                </Combobox.List>
                            </Combobox.Popup>
                        </Combobox.Positioner>
                    </Combobox.Portal>
                </Combobox.Root>
                <span className='text-sm text-ink-500'>{faculties ? 'เลือกได้หลายคณะ แต่ละคณะเลือกสาขาและปีเข้าได้' : 'กำลังโหลดรายชื่อคณะ...'}</span>
            </div>
            {selected.map((f) => {
                const mine = rules.filter((r) => r.facultyCode === f.code)
                const depts = mine.some((r) => !r.departmentCode) ? null : [...new Set(mine.map((r) => r.departmentCode!))]
                const years = mine.some((r) => r.studentYear === null) ? null : [...new Set(mine.map((r) => r.studentYear!))]
                return (
                    <ScopePicker
                        key={f.code}
                        label={f.label}
                        departments={faculties?.find((x) => x.code === f.code)?.departments ?? []}
                        depts={depts}
                        years={years}
                        onChange={(d, y) => setScope(f.code, d, y)}
                    />
                )
            })}
        </div>
    )
}

// ขอบเขตของหนึ่งคณะ: สาขา (ทั้งคณะ หรือเลือกสาขา) และปีเข้า (ทุกปี หรือเลือกปี)
// เอาออกจนไม่เหลือสักรายการให้กลับไปเป็น "ทั้งหมด" ของฝั่งนั้น (รายการว่างไม่มีความหมาย)
function ScopePicker({ label, departments, depts, years, onChange }: {
    label: string
    departments: Department[]
    depts: string[] | null
    years: number[] | null
    onChange: (depts: string[] | null, years: number[] | null) => void
}) {
    const [thisYear] = useState(() => new Date().getFullYear() + 543)
    const yearOptions = Array.from({ length: YEAR_SPAN }, (_, i) => thisYear - i)

    const toggleDept = (code: string, on: boolean) => {
        const next = on ? [...(depts ?? []), code] : (depts ?? []).filter((d) => d !== code)
        onChange(next.length === 0 ? null : next, years)
    }
    const toggleYear = (year: number, on: boolean) => {
        const next = on ? [...(years ?? []), year].sort((a, b) => b - a) : (years ?? []).filter((y) => y !== year)
        onChange(depts, next.length === 0 ? null : next)
    }

    return (
        <fieldset className='flex flex-col gap-2 rounded-xl border px-3 py-2'>
            <legend className='px-1 text-base font-bold'>{label}</legend>
            {departments.length > 0 && (
                <div className='flex flex-col gap-2'>
                    <span className='text-sm text-ink-500'>สาขา</span>
                    <label className='flex items-center gap-2'>
                        {/* ติ๊กทั้งคณะแล้วสาขาย่อยครบและกดไม่ได้ กันสถานะที่ขัดกันเอง (System flow §3) */}
                        <Checkbox checked={depts === null} onCheckedChange={(on) => onChange(on ? null : [departments[0].code], years)} />
                        ทั้งคณะ
                    </label>
                    <div className='grid grid-cols-1 gap-2 pl-6 sm:grid-cols-2'>
                        {departments.map((d) => (
                            <label key={d.code} className='flex items-center gap-2'>
                                <Checkbox
                                    checked={depts === null || depts.includes(d.code)}
                                    disabled={depts === null}
                                    onCheckedChange={(on) => toggleDept(d.code, on)}
                                />
                                {d.nameTh}
                            </label>
                        ))}
                    </div>
                </div>
            )}
            <div className='flex flex-col gap-2'>
                <span className='text-sm text-ink-500'>ปีเข้า</span>
                <label className='flex items-center gap-2'>
                    <Checkbox checked={years === null} onCheckedChange={(on) => onChange(depts, on ? null : [thisYear])} />
                    ทุกปีเข้า
                </label>
                {years !== null && (
                    <div className='grid grid-cols-2 gap-2 pl-6 sm:grid-cols-4'>
                        {yearOptions.map((y) => (
                            <label key={y} className='flex items-center gap-2'>
                                <Checkbox checked={years.includes(y)} onCheckedChange={(on) => toggleYear(y, on)} />
                                ปีเข้า {y}
                            </label>
                        ))}
                    </div>
                )}
            </div>
        </fieldset>
    )
}
