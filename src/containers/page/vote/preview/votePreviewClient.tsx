'use client'
import dynamic from 'next/dynamic'
import { IntroSkeleton } from '../components/voteSkeleton'

// ร่างอยู่ใน localStorage (zustand persist) ฝั่ง server ไม่เห็น จึงเรนเดอร์เฉพาะฝั่ง client กัน hydration ไม่ตรง
export const VotePreviewClient = dynamic(() => import('./votePreview').then((m) => m.VotePreview), {
    ssr: false,
    loading: () => <IntroSkeleton />,
})
