// รูปแบบผลโหวตที่ส่งให้หน้า dashboard ใช้ได้ทั้งฝั่ง server และ client (ไม่มี import ของ pg)

export type ResultQuestionType = 'single_choice' | 'multi_choice' | 'text'

export type ResultOption = { id: string; label: string; count: number }

export type TextAnswer = { id: string; text: string; createdAt: string }

export type ResultQuestion = {
    // position ใน poll_items ใช้อ้างคำถามตอนดึงคำตอบข้อความทั้งหมด
    position: number
    // ลำดับ "ข้อ n" นับเฉพาะคำถาม ไม่นับองค์ประกอบตกแต่ง
    order: number
    title: string
    type: ResultQuestionType
    respondentCount: number
    options?: ResultOption[]
    // ข้อความล่าสุดไม่เกิน TEXT_PREVIEW_LIMIT รายการ ที่เหลือดูผ่าน "ดูทั้งหมด"
    textAnswers?: TextAnswer[]
    textAnswerCount?: number
}

export type PollResults = {
    pollId: string
    // ส่งสถานะกับเวลาปิดมาด้วย หน้าเรียลไทม์จะรู้ทันทีเมื่อเจ้าของกดปิดรับคำตอบจากที่อื่น
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'VOTING' | 'DONE' | 'REJECTED'
    closeAt: string
    totalRespondents: number
    questions: ResultQuestion[]
}

export const TEXT_PREVIEW_LIMIT = 3

export const isChoiceQuestion = (q: ResultQuestion) => q.type !== 'text'
