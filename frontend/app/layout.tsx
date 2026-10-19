import { Geist_Mono } from "next/font/google"

import "@/style/globals.css"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"
import { getMe } from "@/api/server"
import { MeProvider } from "@/containers/providers/meProvider"

// ฟอนต์ไทยทั้งหมดประกาศเป็น @font-face ใน globals.css แล้ว เหลือแค่ mono
// ที่ยังใช้ Geist_Mono เพราะตระกูลจุฬาฯ ไม่มีตัว monospace
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={cn("antialiased", "font-sans", fontMono.variable)}
    >
      <body>
        <MeProvider me={await getMe()}>{children}</MeProvider>
        <Toaster richColors closeButton position="top-center" />
      </body>
    </html>
  )
}
