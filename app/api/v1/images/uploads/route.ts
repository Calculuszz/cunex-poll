import type { ImageMime } from '@/api/types'
import { requireUser } from '@/mock-api/auth'
import { IMAGE_MAX_BYTES, MIME_EXT, createTicket } from '@/mock-api/images'
import { appOrigin, json, problem, rateLimit, readJson, route } from '@/mock-api/http'

// ขอที่อัปโหลดรูป: ไฟล์ไม่ผ่าน API แต่ PUT ไปที่ uploadUrl ตรงๆ แล้วเอา publicUrl ไปใส่ในฉบับร่าง
export const POST = route(async (request) => {
    const user = await requireUser()
    rateLimit(`upload:${user.id}`, 30)
    const { mimeType, byteSize } = await readJson(request)
    if (typeof mimeType !== 'string' || !(mimeType in MIME_EXT)) {
        throw problem(400, 'BAD_REQUEST', 'mimeType ต้องเป็น image/jpeg, image/png หรือ image/webp')
    }
    if (!Number.isInteger(byteSize) || (byteSize as number) <= 0) throw problem(400, 'BAD_REQUEST', 'byteSize ต้องเป็นจำนวนเต็มบวก')
    if ((byteSize as number) > IMAGE_MAX_BYTES) throw problem(422, 'IMAGE_TOO_LARGE', 'รูปใหญ่เกิน 5 MB')
    return json(await createTicket(appOrigin(request), mimeType as ImageMime, byteSize as number, user.id), 201)
})
