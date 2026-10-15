import { Geist_Mono } from "next/font/google"

import "@/style/globals.css"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"

// ฟอนต์ไทยทั้งหมดประกาศเป็น @font-face ใน globals.css แล้ว เหลือแค่ mono
// ที่ยังใช้ Geist_Mono เพราะตระกูลจุฬาฯ ไม่มีตัว monospace
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
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
        {children}
        <Toaster richColors closeButton position="top-center" />
      </body>
    </html>
  )
}
