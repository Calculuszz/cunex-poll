'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye } from 'lucide-react'
import { useCreatePollStore } from '@/store/createPollStore'
import { useElementStore } from '@/store/elementStore'
import { useCreateStepStore } from '@/store/createStepStore'
import { useCreateDraftStore } from '@/store/createDraftStore'
import { audienceLabel, audienceScope } from '@/lib/audienceLabel'
import { parseCodes } from '@/containers/page/create/components/buildPayload'
import { MOCK_FACULTIES } from '@/containers/page/create/components/mockFaculty'
import { firstMissingRequired, paginate, questionsOf, type Answers, type AnswerValue, type VoteItem, type VoterPoll } from '@/lib/voteForm'
import AvatarPopup from '@/containers/widgets/components/avator-popup'
import { PollIntroCard } from '../components/pollIntroCard'
import { AnonymityNote } from '../components/anonymityNote'
import { ElementView } from '../components/elementView'
import { QuestionBlock } from '../components/questionBlock'
import { QuestionProgress } from '../components/questionProgress'
import { StepActionBar } from '../components/stepActionBar'

const NO_RESPONSE = { status: 'none', answers: {}, lastSavedAt: null, submittedAt: null } as const

// หน้าดูตัวอย่างของผู้สร้าง (System flow §4): อ่านจากร่างที่ยังไม่บันทึกใน store ไม่ใช่จาก DB
// ใช้ component ชุดเดียวกับหน้ากรอกจริง ตอบลองได้แต่ส่งไม่ได้ คำตอบอยู่แค่ในหน้านี้
export function VotePreview() {
    const router = useRouter()
    const form = useCreatePollStore()
    const rawItems = useElementStore((s) => s.items)
    const draftId = useCreateDraftStore((s) => s.hydratedId)
    // -1 = หน้าแรกของโพล, 0.. = หน้าคำถาม
    const [pageIndex, setPageIndex] = useState(-1)
    const [answers, setAnswers] = useState<Answers>({})

    const items: VoteItem[] = rawItems.map((item, index) => ({ ...item, key: item.id, position: index + 1 }))
    const pages = paginate(items)
    const questions = questionsOf(items)

    // ร่างยังไม่มีเวลาปิดได้ ใช้อีก 7 วันแทนเพื่อให้หน้าแรกแสดงได้ (คิดครั้งเดียวตอนเปิดหน้า)
    const [fallbackClose] = useState(() => new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString())
    const closeAt = form.closeTime ?? fallbackClose
    const facultyIds = new Set(MOCK_FACULTIES.map((f) => f.value))
    const audienceSource = {
        scope: form.scope,
        audience: {
            faculties: form.audienceIds.filter((id) => facultyIds.has(id)),
            departments: form.audienceIds.filter((id) => !facultyIds.has(id)),
            studentCodes: parseCodes(form.codesText),
            codeKind: form.codeKind,
        },
    }
    const poll: VoterPoll = {
        id: 'preview',
        title: form.title || 'ยังไม่ได้ตั้งชื่อโพล',
        description: form.desc,
        scope: form.scope,
        status: 'VOTING',
        realtime: form.realtime,
        allowRepeat: form.allowRepeat,
        closeAt,
        closedAt: null,
        closedEarly: false,
        closeReason: null,
        audienceLabel: audienceLabel(audienceSource),
        audienceScope: audienceScope(audienceSource),
        identifySender: form.scope !== 'C' && form.identifySender,
        items,
        questionCount: questions.length,
        resultsPublished: true,
    }

    // กลับไปแก้ต่อที่ขั้นคำถาม (ขั้นที่ 2) ของร่างเดิม ร่างยังอยู่ครบใน store
    const backToEdit = () => {
        useCreateStepStore.getState().setResumeStep(2)
        router.push(draftId ? `/create/${draftId}` : '/create')
    }

    const page = pageIndex >= 0 ? pages[pageIndex] : null
    const pageQuestions = page ? questions.filter((q) => page.some((item) => item.key === q.key)) : []
    const goTo = (index: number) => {
        setPageIndex(index)
        window.scrollTo({ top: 0 })
    }
    const setAnswer = (key: string, value: AnswerValue | undefined) => setAnswers((prev) => {
        const next = { ...prev }
        if (value === undefined) delete next[key]
        else next[key] = value
        return next
    })

    return (
        <>
            <header className='sticky top-0 z-30 -mx-4 flex h-16 items-center justify-between border-b bg-background px-4'>
                <button
                    type='button'
                    onClick={backToEdit}
                    className='flex items-center gap-1 rounded-sm font-bold text-primary underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
                >
                    <ArrowLeft className='size-4' />
                    กลับไปแก้ไข
                </button>
                <AvatarPopup />
            </header>
            <p role='status' className='-mx-4 mb-4 flex items-center justify-center gap-2 bg-yellow-100 px-4 py-2 text-sm text-yellow-700'>
                <Eye className='size-4 shrink-0' />
                นี่คือตัวอย่าง ลองตอบได้แต่ส่งคำตอบไม่ได้
            </p>

            {page === null ? (
                <>
                    <PollIntroCard poll={poll} me={NO_RESPONSE} reason={null} resumePage={1} canSeeResults={false} onStart={() => goTo(0)} />
                    <AnonymityNote identified={poll.identifySender} className='mt-4' />
                </>
            ) : (
                <div className='flex flex-1 flex-col'>
                    <QuestionProgress page={pageIndex + 1} total={pages.length} />
                    <div className='flex flex-col gap-8 pt-6'>
                        {page.length === 0 && <p className='text-ink-500'>ร่างนี้ยังไม่มีคำถาม</p>}
                        {page.map((item) => item.kind === 'element'
                            ? <ElementView key={item.key} item={item} />
                            : (
                                <QuestionBlock
                                    key={item.key}
                                    question={questions.find((q) => q.key === item.key)!}
                                    value={answers[item.key]}
                                    onChange={(value) => setAnswer(item.key, value)}
                                />
                            ))}
                    </div>
                    <div className='flex-1' />
                    <StepActionBar
                        isFirst={pageIndex === 0}
                        isLast={pageIndex === pages.length - 1}
                        canNext={firstMissingRequired(pageQuestions, answers) === null}
                        busy={false}
                        onBack={() => goTo(pageIndex - 1)}
                        onNext={() => goTo(pageIndex + 1)}
                        onSubmit={() => {}}
                        preview
                    />
                </div>
            )}
        </>
    )
}
