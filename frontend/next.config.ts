import type { NextConfig } from "next"

// /api/v1/* ของเว็บส่งต่อไป backend (voting-backend) ให้อยู่ origin เดียวกัน
// cookie session `sid` จึงไปถึง backend ทั้งจาก browser และจาก server component โดยไม่ต้องเปิด CORS
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000"

const nextConfig: NextConfig = {
    async rewrites() {
        return [{ source: "/api/v1/:path*", destination: `${BACKEND_URL}/api/v1/:path*` }]
    },
}

export default nextConfig
