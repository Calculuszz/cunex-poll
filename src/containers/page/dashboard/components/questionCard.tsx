import React from 'react'
import { isChoiceQuestion, type ResultQuestion } from '@/lib/pollResultTypes'
import type { ResultView } from '@/lib/resultView'
import { toDisplayOptions, type DisplayNumbers, type DisplayOption } from '@/lib/resultDisplay'
import { ResultListView } from './resultListView'
import { ResultDonutView } from './resultDonutView'
import { ResultBarView } from './resultBarView'
import { TextAnswerList } from './textAnswerList'

const CAPTION: Record<ResultQuestion['type'], string> = {
    single_choice: 'เลือกหนึ่งข้อ',
    multi_choice: 'เลือกได้หลายข้อ',
    text: 'ข้อความ',
}

// เนื้อหาผลของคำถามแบบเลือก ตามมุมมองที่เปิดอยู่ เรียงลำดับ รายการ → โดนัท → แท่ง เสมอ
// ใช้ทั้งหน้าเจ้าของ (เห็นทุกตัวเลข) และหน้าผู้ตอบ (ตัวเลขที่ซ่อนเป็น null)
export function DisplayChoiceResults({ options, total, numbers, views, empty }: {
    options: DisplayOption[]
    total: number | null
    numbers: DisplayNumbers
    views: ResultView[]
    empty: boolean
}) {
    return (
        <div className='flex flex-col gap-6'>
            {empty && <p className='text-ink-500'>ยังไม่มีผู้ตอบ</p>}
            {views.includes('list') && <ResultListView options={options} numbers={numbers} total={total} showHeader={views.length === 1 && !empty} />}
            {views.includes('pie') && <ResultDonutView options={options} numbers={numbers} total={total} />}
            {views.includes('bar') && <ResultBarView options={options} numbers={numbers} />}
        </div>
    )
}

const ALL_NUMBERS = { count: true, percent: true }

export function ChoiceResults({ question, views }: { question: ResultQuestion; views: ResultView[] }) {
    return (
        <DisplayChoiceResults
            options={toDisplayOptions(question, ALL_NUMBERS)}
            total={question.respondentCount}
            numbers={ALL_NUMBERS}
            views={views}
            empty={question.respondentCount === 0}
        />
    )
}

// โครงการ์ดคำถามที่ใช้ร่วมกันทั้งการ์ดผลโหวตและการ์ดดูคำถามก่อนเปิดโหวต: "ข้อ n" + เส้นคั่น + ชื่อคำถาม + คำอธิบายรอง
export function QuestionCardShell({ id, order, title, caption, children }: {
    id: string
    order: number
    title: string
    caption: string
    children: React.ReactNode
}) {
    return (
        <section aria-labelledby={id} className='flex flex-col gap-3 rounded-2xl border bg-card p-4'>
            <div className='flex flex-col gap-2'>
                <span className='font-heading text-lg font-bold'>ข้อ {order}</span>
                <hr />
            </div>
            <div className='flex flex-col'>
                <h3 id={id} className='font-heading text-lg font-bold break-words'>{title}</h3>
                <p className='text-sm text-ink-500'>{caption}</p>
            </div>
            {children}
        </section>
    )
}

export const QUESTION_TYPE_CAPTION = CAPTION

export function QuestionCard({ pollId, question, views }: { pollId: string; question: ResultQuestion; views: ResultView[] }) {
    return (
        <QuestionCardShell
            id={`q-${question.position}`}
            order={question.order}
            title={question.title}
            caption={`${CAPTION[question.type]} · ตอบแล้ว ${question.respondentCount.toLocaleString('th-TH')} คน`}
        >
            {isChoiceQuestion(question) ? (
                <ChoiceResults question={question} views={views} />
            ) : (
                <TextAnswerList
                    pollId={pollId}
                    position={question.position}
                    title={question.title}
                    answers={question.textAnswers ?? []}
                    total={question.textAnswerCount ?? 0}
                />
            )}
        </QuestionCardShell>
    )
}
