# CUNEX Poll — workspace

โฟลเดอร์รวม frontend + backend สำหรับพัฒนาในเครื่อง แต่ละโฟลเดอร์ยังเป็น git repo ของตัวเอง (push แยกกัน)

| โฟลเดอร์ | repo | คืออะไร |
|---|---|---|
| `backend/` | [cunex-club/voting-backend](https://github.com/cunex-club/voting-backend) | NestJS API + worker · Postgres, Redis, S3 (docker compose) |
| `frontend/` | [cunex-club/voting-frontend](https://github.com/cunex-club/voting-frontend) | Next.js เว็บ · เรียก API ผ่าน `/api/v1` ซึ่ง rewrite ไป backend |

```
browser ──► Next.js :3000 ──/api/v1/*──► NestJS :4000 ──► Postgres :55432 · Redis :6379 · S3 :8333
                                              ▲
                                        worker (BullMQ): ปิดโพลตามเวลา, ลิงก์แชร์, แจ้งเตือน CUNEX
```

เว็บกับ API อยู่ origin เดียวกัน (ผ่าน rewrite) cookie session `sid` จึงใช้ได้ทั้งฝั่ง browser และ server component โดยไม่ต้องเปิด CORS

## เริ่มครั้งแรก

```bash
cd backend
pnpm install
docker compose up -d
cp .env.example .env
pnpm db:migrate
```

```bash
cd frontend
bun install            # หรือ npm install
cp .env.example .env.local
```

## รันทุกตัว (3 terminal)

```bash
pnpm --dir backend start:dev
```

```bash
pnpm --dir backend start:worker
```

```bash
cd frontend && bun dev
```

เปิด http://localhost:3000 · ตอน dev backend ใช้ CUNEX แบบ mock: หน้า login มีปุ่มบัญชีทดลอง (ผู้ใช้ทั่วไป / แอดมิน)
หรือเปิด `/api/v1/auth/cunex/login?mockUser=med-2566` (มี `eng-2567`, `med-2566`, `arts-2565`, `admin`)

## เอกสาร

- [backend/docs/api-endpoints.md](backend/docs/api-endpoints.md) — สัญญา API ฉบับเต็ม
- [backend/docs/frontend-migration.md](backend/docs/frontend-migration.md) — หน้าไหนเรียกอะไร, ตารางแปลงชื่อ, error code
- [backend/docs/backend-guide.md](backend/docs/backend-guide.md) — ภาพรวม backend, DB schema

## Test

```bash
pnpm --dir backend test && pnpm --dir backend test:e2e
```

```bash
cd frontend && npx tsc --noEmit && npx eslint .
```
