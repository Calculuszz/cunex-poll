import { redirect } from 'next/navigation'
import { getMe } from '@/api/server'
import { LoginPage } from '@/containers/page/auth/login'

const ERRORS: Record<string, string> = {
    token_expired: 'เซสชันจาก CUNEX หมดอายุ กรุณาเข้าสู่ระบบใหม่',
    cunex_unavailable: 'เชื่อมต่อ CUNEX ไม่ได้ในขณะนี้ ลองใหม่อีกครั้ง',
    google_unavailable: 'ยังไม่เปิดให้เข้าสู่ระบบด้วย Google',
    google_failed: 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ ลองใหม่อีกครั้ง',
}

// ?returnTo= หน้าที่จะกลับไปหลังล็อกอิน · ?error= มาจาก callback ของ backend
export default async function Page({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string }> }) {
    const { returnTo, error } = await searchParams
    const target = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/'
    if (await getMe()) redirect(target)
    return <LoginPage returnTo={target} error={error ? ERRORS[error] ?? 'เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง' : null} />
}
