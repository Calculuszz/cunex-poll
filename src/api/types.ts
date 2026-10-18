// รูปข้อมูลตามสัญญา backend `api-endpoints.md` (v1) — ไฟล์นี้คือแหล่งความจริงเดียวของรูป request/response ฝั่งเว็บ
// ถ้า backend เปลี่ยนสัญญา แก้ที่นี่ก่อน แล้ว TypeScript จะชี้ทุกจุดที่ต้องตามแก้
// [เสนอเพิ่ม] = ฟีเจอร์ที่หน้าเว็บมีแต่สัญญายังไม่มี (backend ชั่วคราวทำให้แล้ว) รายละเอียดในโน้ต "Frontend ↔ API v1"

// ── ทั่วไป ──

export type Uuid = string
// ISO-8601 UTC
export type IsoDateTime = string

export type Page<T> = { items: T[]; nextCursor: string | null }

// application/problem+json (RFC 9457)
export type Problem = {
    type?: string
    title: string
    status: number
    detail?: string
    code: string
    // บาง code แนบรายละเอียดเพิ่ม เช่น POLL_INCOMPLETE / INVALID_ANSWERS / INVALID_IMAGE_URL
    problems?: { path: string; message: string }[]
    currentVersion?: number
    pollStatus?: PollStatus
    facultyCodes?: string[]
}

// ── ผู้ใช้ ──

export type Role = 'user' | 'admin'

export type Department = { code: string; nameTh: string; nameEn: string }

// departments = [เสนอเพิ่ม] สาขาของคณะ ใช้เลือกขอบเขตระดับสาขา
export type Faculty = { code: string; nameTh: string; nameEn: string; departments?: Department[] }

export type Me = {
    id: Uuid
    role: Role
    studentId: string | null
    isChulaVerified: boolean
    faculty: Faculty | null
    studentYear: number | null
    // [เสนอเพิ่ม] สาขาของผู้ใช้ (ตรวจขอบเขตระดับสาขา)
    departmentCode?: string | null
    providers: ('cunex' | 'google')[]
}

// ── โพล ──

export type PollStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'open' | 'closed'

// departmentCode = [เสนอเพิ่ม] จำกัดถึงระดับสาขา (null/ไม่ส่ง = ทั้งคณะ)
export type AudienceRule = { facultyCode: string; departmentCode?: string | null; studentYear: number | null }

export type CodeKind = 'STUDENT' | 'STAFF'

export type Audience =
    | { type: 'public' }
    | { type: 'chula' }
    | { type: 'restricted'; rules: AudienceRule[] }
    // [เสนอเพิ่ม] เฉพาะรหัสนิสิต/บุคลากรที่กำหนด · ผู้ตอบทั่วไปได้ codes ว่าง (เห็นแค่ codeCount) เจ้าของ/แอดมินได้รายชื่อเต็ม
    | { type: 'codes'; codeKind: CodeKind; codes: string[]; codeCount?: number }

export type AudienceType = Audience['type']

export type PollSettings = {
    showResultsRealtime: boolean
    allowAnswerEdit: boolean
    listedPublicly: boolean
    // [เสนอเพิ่ม] ลงคะแนนซ้ำได้: ส่งได้หลายครั้ง นับทุกครั้ง (ใช้ POST /ballots แทน PUT /ballot) · โพลสาธารณะเปิดเสมอ
    allowRepeat: boolean
    // [เสนอเพิ่ม] ระบุคนส่ง: เจ้าของโพลเห็นรหัสผู้ตอบในคำตอบรายชุด/ไฟล์ส่งออก (ใช้ทำแบบทดสอบ) · โพลสาธารณะใช้ไม่ได้
    identifySender: boolean
}

export type ResultView = 'list' | 'pie' | 'bar'

export type ResultDisplay = {
    // false = ผู้ตอบไม่เห็นผลเลย
    published: boolean
    // ข้อแบบเลือกที่ผู้ตอบเห็น null = ทุกข้อ
    elementIds: Uuid[] | null
    views: ResultView[]
    showCount: boolean
    showPercent: boolean
    showTotal: boolean
}

export type OptionPopup = { buttonText?: string | null; title: string; body: string }

export type ElementOption = {
    id?: Uuid
    label: string
    description?: string | null
    imageUrl?: string | null
    imageAlt?: string | null
    popup?: OptionPopup | null
}

export type ChoiceLayout = 'list' | 'grid'

type ElementBase = { id?: Uuid; title?: string | null; isRequired?: boolean }

export type Element = ElementBase & (
    | { type: 'text_question'; config: { placeholder?: string | null; maxLength?: number | null } }
    | { type: 'single_choice'; config: { layout: ChoiceLayout }; options: ElementOption[] }
    | { type: 'multi_choice'; config: { layout: ChoiceLayout; minSelect?: number | null; maxSelect?: number | null }; options: ElementOption[] }
    | { type: 'dropdown'; config: Record<string, never>; options: ElementOption[] }
    | { type: 'description'; config: { showHeading: boolean; sections: { heading?: string | null; body: string }[] } }
    | { type: 'image'; config: { url: string; alt?: string | null; caption?: string | null } }
    | { type: 'info_popup'; config: { buttonText?: string | null; title: string; body: string; imageUrl?: string | null } }
    | { type: 'accordion'; config: { title: string; body: string } }
    | { type: 'page_break'; config: Record<string, never> }
)

export type ElementType = Element['type']
export type ChoiceElement = Extract<Element, { options: ElementOption[] }>
export type QuestionElement = ChoiceElement | Extract<Element, { type: 'text_question' }>

export const QUESTION_TYPES: ElementType[] = ['text_question', 'single_choice', 'multi_choice', 'dropdown']
export const isQuestion = (e: Element): e is QuestionElement => QUESTION_TYPES.includes(e.type)
export const isChoice = (e: Element): e is ChoiceElement => 'options' in e

export type Review = { decision: 'approved' | 'rejected'; comment: string | null; createdAt: IsoDateTime }

// hasDraft = [เสนอเพิ่ม] มีฉบับร่างคำตอบค้างที่ server
export type MyBallotState = { submitted: boolean; canEdit: boolean; hasDraft?: boolean }

export type PollDetail = {
    id: Uuid
    status: PollStatus
    version: number
    title: string
    description: string
    coverImageUrl: string | null
    closesAt: IsoDateTime | null
    submittedAt: IsoDateTime | null
    openedAt: IsoDateTime | null
    closedAt: IsoDateTime | null
    closedEarly: boolean
    closeReason: string | null
    audience: Audience
    settings: PollSettings
    resultDisplay: ResultDisplay
    shareUrl: string | null
    elements: Element[]
    myBallot: MyBallotState | null
    canViewResults: boolean
    isOwner: boolean
    // เฉพาะเจ้าของ/แอดมิน
    reviews?: Review[]
    // [เสนอเพิ่ม] ใครกดปิด (เฉพาะแอดมิน) และสถานะถูกถอดโดยแอดมิน
    closedBy?: string | null
    takenDown?: boolean
    takedownReason?: string | null
}

export type PollSummary = {
    id: Uuid
    status: PollStatus
    title: string
    description: string
    coverImageUrl: string | null
    audience: AudienceType
    closesAt: IsoDateTime | null
    openedAt: IsoDateTime | null
    closedAt: IsoDateTime | null
    closedEarly: boolean
    showResultsRealtime: boolean
    // [เสนอเพิ่ม] ปุ่มในหน้ารวมโพล ("โหวตอีกครั้ง") ต้องรู้ว่าลงคะแนนซ้ำได้ไหม
    allowRepeat?: boolean
    questionCount: number
    createdAt: IsoDateTime
    // เฉพาะหน้ารวมโพล (GET /polls)
    myBallot?: MyBallotState | null
}

// body ของ POST /polls และ PUT /polls/:id (ทุกช่องไม่บังคับตอนเป็นฉบับร่าง)
export type PollDraft = {
    title?: string
    description?: string
    coverImageUrl?: string | null
    closesAt?: IsoDateTime | null
    audience?: Audience
    settings?: Partial<PollSettings>
    elements?: Element[]
}

// ── Ballot ──

export type Answer = { elementId: Uuid; optionIds: Uuid[] } | { elementId: Uuid; text: string }

export type Ballot = { answers: Answer[]; submittedAt?: IsoDateTime }

// ── ผลโหวต ──

export type OptionResult = { optionId: Uuid; count: number | null; percent: number | null; weight: number }

export type ElementResult =
    | { elementId: Uuid; type: 'single_choice' | 'multi_choice' | 'dropdown'; answered: number | null; options: OptionResult[] }
    | { elementId: Uuid; type: 'text_question'; answered: number | null }

export type Breakdown = {
    by: 'faculty' | 'year'
    minGroupSize: number
    groups: (
        | { group: string; total: number; elements: { elementId: Uuid; options: { optionId: Uuid; count: number }[] }[] }
        | { group: string; hidden: true }
    )[]
}

export type PollResults = {
    totalBallots: number | null
    generatedAt: IsoDateTime
    elements: ElementResult[]
    breakdown?: Breakdown
}

// createdAt = [เสนอเพิ่ม] เวลาที่ส่ง (สัญญาตั้งใจไม่ส่ง เพื่อไม่ให้โยงกับคำตอบข้ออื่น — ต้องเคาะ)
export type TextAnswerPage = Page<{ text: string; createdAt?: IsoDateTime }>

// ── [เสนอเพิ่ม] ฉบับร่างคำตอบที่ server ──

export type BallotDraft = { answers: Answer[]; savedAt: IsoDateTime }

// ── [เสนอเพิ่ม] คำตอบรายชุด ──

// respondent = รหัสผู้ตอบ เฉพาะแอดมิน หรือเจ้าของโพลที่เปิดระบุคนส่ง (นอกนั้น null)
export type ResponseRow = { no: number; submittedAt: IsoDateTime; respondent: string | null; answers: Answer[] }
export type ResponsePage = Page<ResponseRow> & { total: number; identityVisible: boolean }

// ── [เสนอเพิ่ม] preset รายชื่อรหัส ──

export type CodePreset = { id: Uuid; name: string; codeKind: CodeKind; codes: string[]; createdAt: IsoDateTime }

// ── รูป ──

export type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp'

export type UploadTicket = {
    uploadUrl: string
    uploadHeaders: Record<string, string>
    publicUrl: string
    expiresInSeconds: number
}

// ── แอดมิน ──

export type AdminUser = {
    id: Uuid
    studentId: string | null
    cunexUserId: string | null
    facultyCode: string | null
    lastLoginAt: IsoDateTime | null
}

export type AuditLog = {
    id: Uuid
    actorId: Uuid | null
    action: string
    entityType: string
    entityId: string
    data: Record<string, unknown>
    createdAt: IsoDateTime
}
