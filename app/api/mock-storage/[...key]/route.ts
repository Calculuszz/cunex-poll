import { db } from '@/mock-api/db'
import { isValidKey, readStored, storeFile } from '@/mock-api/images'

// mock ของ bucket: PUT ไฟล์ตาม uploadUrl (ต้องตรง Content-Type และขนาดที่ประกาศไว้) · GET อ่านแบบสาธารณะ
type Ctx = { params: Promise<{ key: string[] }> }

export async function PUT(request: Request, { params }: Ctx) {
    const key = (await params).key.join('/')
    if (!isValidKey(key)) return new Response('Not found', { status: 404 })
    const { rows } = await db.query<{ mime_type: string; byte_size: number; uploaded: boolean; expired: boolean }>(
        `SELECT mime_type, byte_size, uploaded, created_at < now() - interval '10 minutes' AS expired FROM images WHERE key = $1`, [key])
    const ticket = rows[0]
    if (!ticket || ticket.uploaded || ticket.expired) return new Response('Upload URL expired', { status: 403 })
    if (request.headers.get('content-type') !== ticket.mime_type) return new Response('Content-Type mismatch', { status: 403 })
    const data = Buffer.from(await request.arrayBuffer())
    if (data.length !== ticket.byte_size) return new Response('Size mismatch', { status: 403 })
    await storeFile(key, data)
    return new Response(null, { status: 200 })
}

export async function GET(_request: Request, { params }: Ctx) {
    const key = (await params).key.join('/')
    if (!isValidKey(key)) return new Response('Not found', { status: 404 })
    try {
        const data = await readStored(key)
        const type = key.endsWith('.png') ? 'image/png' : key.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
        return new Response(new Uint8Array(data), { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable' } })
    } catch {
        return new Response('Not found', { status: 404 })
    }
}
