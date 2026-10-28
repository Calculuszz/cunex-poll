import React from 'react'
import type { Element } from '@/api/types'
import type { InputItem } from '@/store/elementStore'
import { elementToItem } from '@/lib/pollMappers'
import { paginate } from '@/lib/voteForm'
import { cn } from '@/lib/utils'
import { ElementView } from '@/containers/page/vote/components/elementView'
import { QUESTION_TYPE_CAPTION, QuestionCardShell } from './questionCard'

const TYPE_KEY = { radio: 'single_choice', select: 'dropdown', checkbox: 'multi_choice', text: 'text_question' } as const

// ดูเนื้อหาโพลที่ยังไม่เปิดโหวต (รออนุมัติ/อนุมัติแล้ว/ไม่อนุมัติ) แบบอ่านอย่างเดียว ครบทุกหน้า
// แบ่งหน้าตามตัวขึ้นหน้าใหม่แบบเดียวกับที่ผู้ตอบเห็น และแสดงข้อความ/รูป/ป๊อปอัพด้วย ไม่ใช่แค่คำถาม
// ให้แอดมินพิจารณาได้ครบว่าโพลมีอะไร และเจ้าของตรวจทานก่อนเปิดโหวต
export function QuestionPreview({ elements }: { elements: Element[] }) {
    const items = elements.map((e, i) => elementToItem(e, i))
    const pages = paginate(items)
    // เลขข้อนับต่อเนื่องข้ามหน้า เหมือนที่ผู้ตอบเห็น
    const orderOf = new Map(items.filter((i) => i.kind === 'input').map((item, i) => [item.id, i + 1]))
    const questionCount = orderOf.size

    return (
        <section aria-labelledby='questions-heading' className='flex flex-col gap-4'>
            <h2 id='questions-heading' className='font-heading text-xl font-bold'>
                เนื้อหาในโพล{' '}
                <span className='text-base font-normal text-ink-500'>
                    ({questionCount} ข้อ{pages.length > 1 ? ` · ${pages.length} หน้า` : ''})
                </span>
            </h2>
            {items.length === 0 && <p className='text-ink-500'>โพลนี้ยังไม่มีคำถาม</p>}
            {pages.map((page, p) => page.length > 0 && (
                <div key={p} className='flex flex-col gap-4'>
                    {pages.length > 1 && (
                        <h3 className='flex items-center gap-3 font-heading text-base font-bold text-primary'>
                            หน้าที่ {p + 1} จาก {pages.length}
                            <span aria-hidden className='h-px flex-1 bg-primary/30' />
                        </h3>
                    )}
                    {page.map((item) => {
                        if (item.kind === 'element') {
                            return (
                                <div key={item.id} className='rounded-2xl border px-4 py-3'>
                                    <ElementView item={item} />
                                </div>
                            )
                        }
                        const data = item as InputItem
                        return (
                            <QuestionCardShell
                                key={item.id}
                                id={`preview-q-${item.id}`}
                                order={orderOf.get(item.id)!}
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
                        )
                    })}
                </div>
            ))}
        </section>
    )
}
