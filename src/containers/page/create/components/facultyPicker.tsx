'use client'
import React, { useId, useState } from 'react'
import { Combobox } from '@base-ui/react/combobox'
import { CheckIcon, XIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { useDebouncedField } from '@/hooks/useDebouncedField'
import { MOCK_FACULTIES } from './mockFaculty'

type ScopeItem = {
    id: string
    kind: 'faculty' | 'department'
    facultyId: string
    label: string
}

// รวมคณะและสาขาไว้ในรายการเดียว เพื่อให้พิมพ์ค้นได้ทั้งชื่อคณะและชื่อสาขา
const SCOPE_ITEMS: ScopeItem[] = MOCK_FACULTIES.flatMap((faculty) => [
    { id: faculty.value, kind: 'faculty', facultyId: faculty.value, label: `${faculty.label} (ทั้งคณะ)` },
    ...faculty.departments.map((dept) => ({
        id: dept.value,
        kind: 'department' as const,
        facultyId: faculty.value,
        label: `${faculty.label} · ${dept.label}`,
    })),
])

export function FacultyPicker() {
    const inputId = useId()
    const [selected, setSelected] = useState<ScopeItem[]>([])
    // ช่องพิมพ์แสดงผลทันที แต่คำค้นที่ใช้กรองรายการจะอัปเดตหลังหยุดพิมพ์ 300ms
    const [query, setQuery] = useState('')
    const [inputValue, setInputValue] = useDebouncedField(query, setQuery)

    const keyword = query.trim().toLowerCase()
    const visibleItems = keyword
        ? SCOPE_ITEMS.filter((item) => item.label.toLowerCase().includes(keyword))
        : SCOPE_ITEMS

    // เลือกทั้งคณะแล้ว สาขาในคณะนั้นจะซ้ำซ้อน จึงตัดออกทันที
    const handleChange = (next: ScopeItem[]) => {
        setSelected(next.filter((item) =>
            item.kind === 'faculty' || !next.some((other) => other.kind === 'faculty' && other.id === item.facultyId)
        ))
    }

    return (
        <div className='flex flex-col gap-1 mt-2'>
            <Label htmlFor={inputId} className='font-bold text-base'>คณะ / สาขา</Label>
            <Combobox.Root
                items={visibleItems}
                // ปิดการกรองในตัวของ Base UI เพราะกรองเองจาก query ที่ debounce แล้ว
                filter={null}
                multiple
                value={selected}
                onValueChange={handleChange}
                inputValue={inputValue}
                onInputValueChange={setInputValue}
                itemToStringLabel={(item) => item.label}
                isItemEqualToValue={(a, b) => a.id === b.id}
            >
                <Combobox.InputGroup className='flex min-h-8 w-full flex-wrap items-center rounded-lg border border-input bg-transparent px-2 py-1 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30'>
                    <Combobox.Chips className='flex w-full flex-wrap items-center gap-1'>
                        <Combobox.Value>
                            {(value: ScopeItem[]) => (
                                <React.Fragment>
                                    {value.map((item) => (
                                        <Combobox.Chip
                                            key={item.id}
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
                                        placeholder={value.length > 0 ? '' : 'พิมพ์เพื่อค้นหาคณะหรือสาขา'}
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
                                <div className='px-2 py-1.5 text-sm text-ink-500'>ไม่พบคณะหรือสาขา</div>
                            </Combobox.Empty>
                            <Combobox.List>
                                {(item: ScopeItem) => (
                                    <Combobox.Item
                                        key={item.id}
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
            <span className='text-sm text-ink-500'>เลือกคณะเพื่อรับทั้งคณะ หรือเลือกสาขาเพื่อรับเฉพาะสาขานั้น</span>
        </div>
    )
}
