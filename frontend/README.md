# CUNEX Poll — web

Next.js 16 + shadcn/ui · ข้อมูลทั้งหมดมาจาก [voting-backend](https://github.com/cunex-club/voting-backend)

## รัน

1. รัน backend ก่อน (ดู README ของ voting-backend) ค่าเริ่มต้นอยู่ที่ `http://localhost:4000`
2. ตั้งค่าเว็บ:
   ```bash
   cp .env.example .env.local
   bun install
   bun dev
   ```
3. เปิด http://localhost:3000 · ตอน dev หน้า login มีปุ่มบัญชีทดลอง

## เชื่อมกับ backend ยังไง

- `next.config.ts` rewrite `/api/v1/*` ไปที่ `BACKEND_URL` เว็บกับ API จึงอยู่ origin เดียวกัน cookie session `sid` ไปเอง ไม่ต้องเปิด CORS
- เรียก API ผ่าน `src/api` ที่เดียว: `api` ใน client component, `getServerApi()` ใน server component (ส่ง cookie ของผู้ใช้ต่อให้)
- รูปร่าง request/response อยู่ใน `src/api/types.ts` ตามเอกสาร `docs/api-endpoints.md` และ `docs/frontend-migration.md` ของ backend
- error เป็น problem+json `errorMessage()` แปลง `code` เป็นข้อความไทยให้
- ฉบับร่างคำตอบที่ยังไม่ส่งเก็บในเบราว์เซอร์ (`src/lib/voteDraft.ts`) backend ไม่เก็บคำตอบที่ยังไม่ส่ง
