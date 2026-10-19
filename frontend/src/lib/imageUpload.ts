import { api, isApiError } from '@/api'
import { compressImage, COMPRESSED_IMAGE_TYPE, ImageFileError } from './imageFile'

const UPLOAD_FAILED = 'อัพโหลดรูปไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง'

// อัปโหลดรูปตามสัญญา §5: ไฟล์ไม่ผ่าน API
// 1) POST /images/uploads ได้ uploadUrl (ชั่วคราว) + publicUrl (ถาวร)
// 2) PUT ไฟล์ไปที่ uploadUrl พร้อม uploadHeaders (Content-Type และขนาดต้องตรงที่ประกาศ)
// 3) คืน publicUrl ไปใส่ในฉบับร่าง
// ย่อรูปก่อนเสมอ รูปจากกล้องมือถือหลาย MB เกินเพดาน 5 MB ของ backend และอัปช้าบนเน็ตมือถือ
export async function uploadImage(file: File, signal?: AbortSignal): Promise<string> {
    const blob = await compressImage(file)
    try {
        const ticket = await api.images.requestUpload(COMPRESSED_IMAGE_TYPE, blob.size, signal)
        const put = await fetch(ticket.uploadUrl, { method: 'PUT', headers: ticket.uploadHeaders, body: blob, signal })
        if (!put.ok) throw new ImageFileError(UPLOAD_FAILED)
        return ticket.publicUrl
    } catch (err) {
        // ถูกยกเลิกเอง (เลือกรูปใหม่ซ้อน, กดลบ, การ์ดถูกลบ) ไม่ใช่ความล้มเหลวที่ต้องบอกผู้ใช้ ปล่อยให้คนเรียกจัดการ
        if (err instanceof ImageFileError || signal?.aborted) throw err
        if (isApiError(err, 'IMAGE_TOO_LARGE')) throw new ImageFileError('รูปใหญ่เกิน 5 MB กรุณาเลือกรูปที่เล็กกว่านี้')
        if (isApiError(err, 'RATE_LIMITED')) throw new ImageFileError('อัปโหลดรูปถี่เกินไป รอสักครู่แล้วลองใหม่')
        throw new ImageFileError(UPLOAD_FAILED)
    }
}
