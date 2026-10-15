'use client'
import React, { useState } from 'react'
import { Upload } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import type { PollResults } from '@/lib/pollResultTypes'
import type { ResultView } from '@/lib/resultView'
import { cn } from '@/lib/utils'
import { ViewToggleBar } from './viewToggleBar'
import { QuestionCard } from './questionCard'
import { ResponseList } from './responseList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ส่วนผลโหวตในหน้ารายละเอียด แท็บ "สรุปผล" (มุมมองที่เลือกใช้กับทุกข้อพร้อมกัน ข้อความไม่สนมุมมอง) และ "คำตอบรายชุด"
// withIdentity = หน้าแอดมิน หรือโพลที่เปิด "ระบุคนส่ง": คำตอบรายชุดและไฟล์ส่งออกมีรหัสผู้ตอบ (API ตรวจสิทธิ์ซ้ำ)
export function ResultsSection({ results, withIdentity = false }: { results: PollResults; withIdentity?: boolean }) {
    const [views, setViews] = useState<ResultView[]>(['list'])
    return (
        <section aria-labelledby='results-heading' className='flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
                <h2 id='results-heading' className='font-heading text-xl font-bold'>ผลโหวต</h2>
                {/* ดาวน์โหลดตรงจาก route ที่ตอบเป็นไฟล์ CSV */}
                <a
                    href={`/api/polls/${results.pollId}/export${withIdentity ? '?withIdentity=1' : ''}`}
                    download
                    className={cn(buttonVariants({ variant: 'outline' }), 'rounded-full font-heading text-base font-bold')}
                >
                    <Upload />
                    ส่งออก
                </a>
            </div>
            <Tabs defaultValue='summary' className='flex flex-col gap-4'>
                <TabsList variant='line' className='flex w-full *:text-base *:font-bold'>
                    <TabsTrigger value='summary'>สรุปผล</TabsTrigger>
                    <TabsTrigger value='responses'>คำตอบรายชุด</TabsTrigger>
                </TabsList>
                <TabsContent value='summary' className='flex flex-col gap-4'>
                    <ViewToggleBar views={views} onChange={setViews} total={results.totalRespondents} />
                    {results.questions.length === 0 && <p className='text-ink-500'>โพลนี้ยังไม่มีคำถาม</p>}
                    {results.questions.map((q) => (
                        <QuestionCard key={q.position} pollId={results.pollId} question={q} views={views} />
                    ))}
                </TabsContent>
                {/* โหลดคำตอบเมื่อเปิดแท็บนี้เท่านั้น (TabsContent ไม่ render แท็บที่ปิดอยู่) */}
                <TabsContent value='responses'>
                    <ResponseList pollId={results.pollId} questions={results.questions} withIdentity={withIdentity} />
                </TabsContent>
            </Tabs>
        </section>
    )
}
