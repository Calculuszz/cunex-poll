import { blobToDataUrl, compressImage, COMPRESSED_IMAGE_TYPE, ImageFileError } from './imageFile'

/**
 * จุดเดียวที่ต้องแก้ตอนต่อ S3 จริง
 *
 * ตั้ง NEXT_PUBLIC_IMAGE_PRESIGN_URL ใน .env.local เป็น endpoint ของ backend ที่ออก presigned URL
 * (ค่า NEXT_PUBLIC_* ถูกฝังตอน build ต้อง restart dev server / build ใหม่หลังแก้)
 * ถ้าไม่ตั้ง รูปจะถูกเก็บเป็น data URL ใน draft เหมือนเดิม
 *
 * สัญญาที่โค้ดนี้คาดจาก backend — ถ้า backend จริงออกแบบต่างจากนี้ แก้ที่ requestUploadTarget() ที่เดียว
 *   POST {NEXT_PUBLIC_IMAGE_PRESIGN_URL}
 *   body:     { "contentType": "image/jpeg", "size": 123456 }
 *   response: { "uploadUrl": "<presigned PUT URL ของ S3>", "publicUrl": "<ลิงก์ที่ใช้แสดงรูป>" }
 *
 * ฝั่ง S3 ต้องตั้ง CORS ของ bucket ให้ origin ของเว็บนี้ PUT ได้ และอนุญาต header Content-Type
 */
const PRESIGN_URL = process.env.NEXT_PUBLIC_IMAGE_PRESIGN_URL

export const isRemoteUpload = Boolean(PRESIGN_URL)

const UPLOAD_FAILED = 'อัพโหลดรูปไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง'

type UploadTarget = { uploadUrl: string; publicUrl: string }

async function requestUploadTarget(blob: Blob, signal?: AbortSignal): Promise<UploadTarget> {
    const res = await fetch(PRESIGN_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // proxy.ts อ่านสิทธิ์จาก cookie `token` เลยส่ง cookie ไปด้วย ถ้า backend ใช้ Authorization header ให้เปลี่ยนตรงนี้
        credentials: 'include',
        body: JSON.stringify({ contentType: blob.type, size: blob.size }),
        signal,
    })
    if (!res.ok) throw new ImageFileError(UPLOAD_FAILED)

    const data: Partial<UploadTarget> = await res.json()
    if (!data.uploadUrl || !data.publicUrl) throw new ImageFileError(UPLOAD_FAILED)
    return { uploadUrl: data.uploadUrl, publicUrl: data.publicUrl }
}

/** คืนค่าที่เอาไปใส่ `src` ของรูปได้เลย — ลิงก์บน S3 เมื่อต่อแล้ว หรือ data URL เมื่อยังไม่ได้ต่อ */
export async function uploadImage(file: File, signal?: AbortSignal): Promise<string> {
    const blob = await compressImage(file)
    if (!isRemoteUpload) return blobToDataUrl(blob)

    try {
        const { uploadUrl, publicUrl } = await requestUploadTarget(blob, signal)
        const put = await fetch(uploadUrl, {
            method: 'PUT',
            // ต้องตรงกับ contentType ที่ใช้เซ็น presigned URL ไม่งั้น S3 ตอบ 403 SignatureDoesNotMatch
            headers: { 'Content-Type': COMPRESSED_IMAGE_TYPE },
            body: blob,
            signal,
        })
        if (!put.ok) throw new ImageFileError(UPLOAD_FAILED)
        return publicUrl
    } catch (err) {
        // ถูกยกเลิกเอง (เลือกรูปใหม่ซ้อน, กดลบ, การ์ดถูกลบ) ไม่ใช่ความล้มเหลวที่ต้องบอกผู้ใช้ ปล่อยให้คนเรียกจัดการ
        if (err instanceof ImageFileError || signal?.aborted) throw err
        // fetch โยน TypeError เมื่อเน็ตหลุดหรือโดน CORS บล็อก
        throw new ImageFileError(UPLOAD_FAILED)
    }
}
