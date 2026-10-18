import 'server-only'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { ImageMime } from '@/api/types'
import { db } from './db'

// mock ของ S3: ไฟล์อยู่ในโฟลเดอร์ .mock-storage ของโปรเจกต์ เสิร์ฟผ่าน /api/mock-storage/images/<uuid>.<ext>
// backend จริงคืน uploadUrl เป็น presigned URL ของ bucket และ publicUrl เป็นลิงก์สาธารณะของไฟล์
export const STORAGE_DIR = path.join(process.cwd(), '.mock-storage')
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const MIME_EXT: Record<ImageMime, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

const KEY_RE = /^images\/[0-9a-f-]{36}\.(jpg|png|webp)$/
const URL_PATH_RE = /^\/api\/mock-storage\/(images\/[0-9a-f-]{36}\.(?:jpg|png|webp))$/

export const keyOfUrl = (url: string) => {
    try {
        return URL_PATH_RE.exec(new URL(url).pathname)?.[1] ?? null
    } catch {
        return null
    }
}

export const isOurImageUrl = (url: string) => keyOfUrl(url) !== null
export const isValidKey = (key: string) => KEY_RE.test(key)

export async function createTicket(origin: string, mimeType: ImageMime, byteSize: number, userId: string) {
    const key = `images/${randomUUID()}.${MIME_EXT[mimeType]}`
    await db.query('INSERT INTO images (key, mime_type, byte_size, created_by) VALUES ($1, $2, $3, $4)', [key, mimeType, byteSize, userId])
    const url = `${origin}/api/mock-storage/${key}`
    return { uploadUrl: url, uploadHeaders: { 'Content-Type': mimeType }, publicUrl: url, expiresInSeconds: 600 }
}

export async function storeFile(key: string, data: Buffer) {
    const file = path.join(STORAGE_DIR, key)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, data)
    await db.query('UPDATE images SET uploaded = TRUE WHERE key = $1', [key])
}

export async function readStored(key: string) {
    return readFile(path.join(STORAGE_DIR, key))
}

// ไฟล์ต้องมีจริงและหัวไฟล์ต้องเป็น JPEG/PNG/WebP จริง (ไม่เชื่อแค่นามสกุล)
export async function isRealImage(url: string) {
    const key = keyOfUrl(url)
    if (!key) return false
    try {
        const head = (await readStored(key)).subarray(0, 12)
        const jpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff
        const png = head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        const webp = head.subarray(0, 4).toString() === 'RIFF' && head.subarray(8, 12).toString() === 'WEBP'
        return jpeg || png || webp
    } catch {
        return false
    }
}
