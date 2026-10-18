import React from 'react'
import type { Element } from '@/api/types'
import { isQuestion } from '@/api/types'
import type { InputItem } from '@/store/elementStore'
import { elementToItem } from '@/lib/pollMappers'
import { cn } from '@/lib/utils'
import { QUESTION_TYPE_CAPTION, QuestionCardShell } from './questionCard'

const TYPE_KEY = { radio: 'single_choice', select: 'dropdown', checkbox: 'multi_choice', text: 'text_question' } as const

// ดูคำถามของโพลที่ยังไม่เปิดโหวต (รออนุมัติ/อนุมัติแล้ว/ไม่อนุมัติ) แบบอ่านอย่างเดียว
// ให้แอดมินพิจารณาได้ว่าโพลถามอะไร และเจ้าของตรวจทานก่อนเปิดโหวต
export function QuestionPreview({ elements }: { elements: Element[] }) {
    const questions = elements
        .filter(isQuestion)
        .map((e, i) => ({ position: i + 1, data: elementToItem(e, i) as InputItem }))

    return (
        <section aria-labelledby='questions-heading' className='flex flex-col gap-4'>
            <h2 id='questions-heading' className='font-heading text-xl font-bold'>
                คำถามในโพล <span className='text-base font-normal text-ink-500'>({questions.length} ข้อ)</span>
            </h2>
            {questions.length === 0 && <p className='text-ink-500'>โพลนี้ยังไม่มีคำถาม</p>}
            {questions.map(({ position, data }, index) => (
                <QuestionCardShell
                    key={position}
                    id={`preview-q-${position}`}
                    order={index + 1}
                    title={data.label || 'ไม่มีชื่อคำถาม'}
                    caption={`${QUESTION_TYPE_CAPTION[TYPE_KEY[data.type]]}${data.required ? ' · จำเป็นต้องตอบ' : ''}`}
                >
                    {data.type === 'text' ? (
                        <div className='rounded-xl border border-dashed px-3 py-2 text-ink-500'>
                            {data.placeholder || 'ผู้ตอบพิมพ์คำตอบเอง'}
                        </div>
                    ) : (
                        <ul className='flex flex-col gap-2'>
                            {data.options.map((o) => (
                                <li key={o.id} className='flex items-center gap-2'>
                                    {/* วงกลม = เลือกได้ข้อเดียว, สี่เหลี่ยม = เลือกได้หลายข้อ */}
                                    <span
                                        aria-hidden
                                        className={cn('size-4 shrink-0 border-2 border-ink-400', data.type === 'checkbox' ? 'rounded-sm' : 'rounded-full')}
                                    />
                                    {o.imageUrl && (
                                        // รูปมาจาก storage ของ backend (โดเมนเปลี่ยนตามที่ตั้ง) จึงใช้ img ธรรมดาแทน next/image
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={o.imageUrl} alt={o.imageAlt ?? ''} loading='lazy' className='size-12 shrink-0 rounded-md object-cover' />
                                    )}
                                    <span className='min-w-0 break-words'>{o.label || 'ไม่มีชื่อตัวเลือก'}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </QuestionCardShell>
            ))}
        </section>
    )
}
