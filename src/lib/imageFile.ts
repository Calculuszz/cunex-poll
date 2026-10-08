const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_EDGE = 1280
const JPEG_QUALITY = 0.82

export const COMPRESSED_IMAGE_TYPE = 'image/jpeg'

/** ข้อความใน error นี้เขียนไว้ให้แสดงกับผู้ใช้ได้ตรงๆ */
export class ImageFileError extends Error {}

function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new ImageFileError('เปิดรูปนี้ไม่ได้ กรุณาลองเลือกรูปอื่น'))
        img.src = src
    })
}

/**
 * ย่อรูปให้ด้านยาวไม่เกิน MAX_EDGE แล้วคืนเป็น JPEG
 * ทำก่อนเสมอไม่ว่าปลายทางจะเป็น S3 หรือ draft ในเครื่อง — รูปจากกล้องมือถือหลาย MB
 * ถ้าส่งตรงๆ จะอัพช้าบนเน็ตมือถือ และถ้าเก็บในเครื่อง รูปเดียวก็เต็มโควตา localStorage แล้ว
 */
export async function compressImage(file: File): Promise<Blob> {
    if (!file.type.startsWith('image/')) {
        throw new ImageFileError('ไฟล์นี้ไม่ใช่รูปภาพ กรุณาเลือกไฟล์รูป เช่น .jpg หรือ .png')
    }
    if (file.size > MAX_FILE_BYTES) {
        throw new ImageFileError('รูปมีขนาดเกิน 10 MB กรุณาเลือกรูปที่เล็กกว่านี้')
    }

    const objectUrl = URL.createObjectURL(file)
    try {
        const img = await loadImage(objectUrl)
        const longest = Math.max(img.naturalWidth, img.naturalHeight)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!longest || !ctx) throw new ImageFileError('เปิดรูปนี้ไม่ได้ กรุณาลองเลือกรูปอื่น')

        const scale = Math.min(1, MAX_EDGE / longest)
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
        // JPEG ไม่มีช่องโปร่งใส ถ้าไม่ถมขาวก่อน พื้นโปร่งของ PNG จะกลายเป็นดำ
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, COMPRESSED_IMAGE_TYPE, JPEG_QUALITY),
        )
        if (!blob) throw new ImageFileError('เปิดรูปนี้ไม่ได้ กรุณาลองเลือกรูปอื่น')
        return blob
    } finally {
        URL.revokeObjectURL(objectUrl)
    }
}

export function blobToDataUrl(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new ImageFileError('เปิดรูปนี้ไม่ได้ กรุณาลองเลือกรูปอื่น'))
        reader.readAsDataURL(blob)
    })
}
