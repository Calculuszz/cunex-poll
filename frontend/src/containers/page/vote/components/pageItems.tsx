'use client'
import React from 'react'
import type { AnswerValue, Answers, VoteItem, VoteQuestion } from '@/lib/voteForm'
import { ElementView } from './elementView'
import { QuestionBlock } from './questionBlock'

// คำถาม/องค์ประกอบของหน้าหนึ่ง คั่นแต่ละชิ้นด้วยเส้นบางให้แยก section ออกจากกันชัด
// ใช้ทั้งหน้ากรอกจริงและหน้าดูตัวอย่าง หน้าตาจึงตรงกันเสมอ
export function PageItems({ page, questions, answers, onAnswer }: {
    page: VoteItem[]
    questions: VoteQuestion[]
    answers: Answers
    onAnswer: (key: string, value: AnswerValue | undefined) => void
}) {
    return (
        <div className='flex flex-col divide-y pt-6'>
            {page.map((item) => (
                <div key={item.key} className='py-6 first:pt-0 last:pb-0'>
                    {item.kind === 'element'
                        ? <ElementView item={item} />
                        : (
                            <QuestionBlock
                                question={questions.find((q) => q.key === item.key)!}
                                value={answers[item.key]}
                                onChange={(value) => onAnswer(item.key, value)}
                            />
                        )}
                </div>
            ))}
        </div>
    )
}
