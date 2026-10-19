import { redirect } from 'next/navigation'

// จอผลเรียลไทม์ของเจ้าของถูกแทนด้วยหน้าตั้งค่าการเผยแพร่ (มีตัวอย่างผลที่ผู้ตอบเห็น) ลิงก์เก่าพาไปหน้าใหม่
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    redirect(`/dashboard/${slug}/publish`)
}
