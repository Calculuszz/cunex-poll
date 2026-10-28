'use client'
import React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { textAnswerMax, type AnswerValue, type VoteQuestion } from '@/lib/voteForm'
import { effectiveMaxSelect } from '@/lib/pollMappers'
import { ChoiceOptions } from './choiceOptions'

const HINT: Record<VoteQuestion['type'], string> = {
    radio: 'เลือกหนึ่งตัวเลือก',
    select: 'เลือกหนึ่งตัวเลือก',
    checkbox: 'เลือกได้หลายตัวเลือก',
    text: 'พิมพ์คำตอบ',
}

function hintOf(question: VoteQuestion) {
    const max = question.type === 'checkbox' ? effectiveMaxSelect(question) : undefined
    return max === undefined ? HINT[question.type] : `เลือกได้สูงสุด ${max} ตัวเลือก`
}

// หัวคำถาม (ข้อ n · ชื่อ · คำแนะนำ) + ช่องตอบ ใช้ทั้งหน้ากรอกและหน้าดูคำตอบแบบอ่านอย่างเดียว
export function QuestionBlock({ question, value, onChange, readOnly }: {
    question: VoteQuestion
    value: AnswerValue | undefined
    onChange?: (value: AnswerValue | undefined) => void
    readOnly?: boolean
}) {
    const titleId = `q-${question.key}-title`
    const text = typeof value === 'string' ? value : ''

    return (
        <section aria-labelledby={titleId} className='flex flex-col gap-3'>
            <div className='flex flex-col gap-0.5'>
                <span className='font-heading text-lg font-bold'>ข้อ {question.order}</span>
                <h2 id={titleId} className='font-heading text-xl font-bold break-words'>
                    {question.label}
                    {question.required && <span className='text-destructive' aria-label='ต้องตอบ'> *</span>}
                </h2>
                <p className='text-sm text-ink-500'>{hintOf(question)}</p>
            </div>

            {question.type === 'text' ? (
                readOnly ? (
                    <p className='rounded-xl bg-inner-bg px-4 py-3 break-words whitespace-pre-line'>
                        {text || <span className='text-ink-500'>ไม่ได้ตอบ</span>}
                    </p>
                ) : (
                    <div className='flex flex-col gap-1'>
                        <Textarea
                            aria-labelledby={titleId}
                            value={text}
                            maxLength={textAnswerMax(question)}
                            rows={4}
                            placeholder={question.placeholder || 'พิมพ์คำตอบของคุณ...'}
                            onChange={(e) => onChange?.(e.target.value === '' ? undefined : e.target.value)}
                            className='rounded-xl bg-card px-4 py-3 text-base'
                        />
                        <span className='self-end text-sm text-ink-500 tabular-nums'>{text.length}/{textAnswerMax(question)}</span>
                    </div>
                )
            ) : (
                <ChoiceOptions
                    question={question}
                    value={value}
                    onChange={onChange}
                    readOnly={readOnly}
                    labelledBy={titleId}
                />
            )}
        </section>
    )
}
