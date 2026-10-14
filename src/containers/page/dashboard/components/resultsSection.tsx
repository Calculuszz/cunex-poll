'use client'
import React, { useState } from 'react'
import { Upload } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import type { PollResults } from '@/lib/pollResultTypes'
import type { ResultView } from '@/lib/resultView'
import { cn } from '@/lib/utils'
import { ViewToggleBar } from './viewToggleBar'
import { QuestionCard } from './questionCard'

// ส่วนผลโหวตในหน้ารายละเอียด มุมมองที่เลือกใช้กับทุกข้อพร้อมกัน (ข้อความไม่สนมุมมอง)
export function ResultsSection({ results }: { results: PollResults }) {
    const [views, setViews] = useState<ResultView[]>(['list'])
    return (
        <section aria-labelledby='results-heading' className='flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
                <h2 id='results-heading' className='font-heading text-xl font-bold'>ผลโหวต</h2>
                {/* ดาวน์โหลดตรงจาก route ที่ตอบเป็นไฟล์ CSV */}
                <a
                    href={`/api/polls/${results.pollId}/export`}
                    download
                    className={cn(buttonVariants({ variant: 'outline' }), 'rounded-full font-heading text-base font-bold')}
                >
                    <Upload />
                    ส่งออก
                </a>
            </div>
            <ViewToggleBar views={views} onChange={setViews} total={results.totalRespondents} />
            {results.questions.length === 0 && <p className='text-ink-500'>โพลนี้ยังไม่มีคำถาม</p>}
            {results.questions.map((q) => (
                <QuestionCard key={q.position} pollId={results.pollId} question={q} views={views} />
            ))}
        </section>
    )
}
