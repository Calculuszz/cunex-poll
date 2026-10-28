'use client'
import '@/style/globals.css'

// error ที่เกิดใน root layout เอง (เช่นดึงข้อมูลผู้ใช้จาก backend ไม่ได้) หน้านี้แทนทั้ง layout จึงต้องมี html/body เอง
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <html lang='th'>
            <body className='antialiased font-sans'>
                <main className='flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center'>
                    <h1 className='font-heading text-2xl font-bold'>เกิดข้อผิดพลาด</h1>
                    <p className='text-ink-500'>ระบบขัดข้องชั่วคราว ลองใหม่อีกครั้งในอีกสักครู่</p>
                    {error.digest && <p className='text-xs text-ink-400'>รหัสอ้างอิง {error.digest}</p>}
                    <button type='button' onClick={reset} className='mt-2 rounded-full bg-primary px-6 py-2 font-heading text-base font-bold text-primary-foreground'>
                        ลองใหม่
                    </button>
                </main>
            </body>
        </html>
    )
}
