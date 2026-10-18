import { API_BASE, buildUrl, createRequester } from './client'
import { makeApi } from './endpoints'

export { ApiError, errorMessage, isApiError } from './client'
export type { Api } from './endpoints'

// ใช้ใน client component (browser ส่ง cookie sid ไปเอง)
export const api = makeApi(createRequester(API_BASE))

// ลิงก์ล็อกอินเป็นการเปลี่ยนหน้าทั้งหน้า (302 ไปผู้ให้บริการ) ไม่ใช่ fetch
// [เสนอเพิ่ม] ไฟล์ CSV เปิดเป็นลิงก์ดาวน์โหลดตรง (ไม่ใช่ JSON)
export const exportUrl = (pollId: string, withIdentity: boolean) =>
    buildUrl(API_BASE, `/polls/${encodeURIComponent(pollId)}/export`, { withIdentity: withIdentity ? 1 : null })

export const authUrls = {
    cunex: (returnTo = '/') => buildUrl(API_BASE, '/auth/cunex/login', { returnTo }),
    google: (returnTo = '/') => buildUrl(API_BASE, '/auth/google/login', { returnTo }),
}
