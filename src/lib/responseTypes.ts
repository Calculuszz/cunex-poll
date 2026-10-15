// คำตอบรายชุด (API contract §5 ResponseRow) ใช้ได้ทั้ง server และ client

export type ResponseRow = {
    // ลำดับตามเวลาที่ส่ง เลขเดียวกับคอลัมน์ "ลำดับ" ในไฟล์ export
    no: number
    submittedAt: string
    // รหัสผู้ตอบ มีค่าเฉพาะตอนแอดมินขอ (withIdentity) ฝั่งเจ้าของโพลเป็น null เสมอ
    respondent: string | null
    // position ของคำถาม → คำตอบที่อ่านได้ (label ของตัวเลือก หรือข้อความ)
    answers: Record<number, string[]>
}

export type ResponsesPage = {
    total: number
    page: number
    pageSize: number
    identityVisible: boolean
    rows: ResponseRow[]
}

export const RESPONSES_PAGE_SIZE = 10
