import React from 'react'
import { Bookmark } from 'lucide-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { PresetCard } from './components/presetCard'
import { AddPresetDialog } from './components/addPresetDialog'
import { getPresets } from '@/lib/presets'

// หน้าจัดการ preset รหัสของผู้ใช้ปัจจุบัน เพิ่มได้จากปุ่มลอยมุมขวาล่าง
// pb-24 กันการ์ดแถวสุดท้ายถูกปุ่มลอยบัง
export async function PresetsPage() {
    const presets = await getPresets()

    return (
        <div className='flex flex-col gap-4 pb-24'>
            <h1 className='font-heading text-4xl font-bold'>จัดการ preset</h1>
            {presets.length === 0 ? (
                <Empty className='py-12'>
                    <EmptyHeader>
                        <EmptyMedia className='size-16 rounded-full bg-inner-bg text-ink-500'>
                            <Bookmark className='size-8' />
                        </EmptyMedia>
                        <EmptyTitle className='font-heading text-xl font-bold'>ยังไม่มี preset</EmptyTitle>
                        <EmptyDescription className='text-base text-ink-500'>
                            กด &quot;เพิ่ม preset&quot; มุมขวาล่าง หรือกด save preset ตอนสร้างโพลแบบกำหนดจากรหัส
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : (
                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                    {presets.map((preset) => (
                        <PresetCard key={preset.id} preset={preset} />
                    ))}
                </div>
            )}
            <AddPresetDialog />
        </div>
    )
}
