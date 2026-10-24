# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

ระบบโพลสำหรับนิสิตจุฬาฯ บน CUNEX · repo เดียวมี 2 โปรเจกต์ที่แยก package manager กัน: `backend/` (NestJS, **pnpm**) และ `frontend/` (Next.js, **bun**) ไม่มี workspace ที่ root

## คำสั่ง

### Backend (`backend/`)

```bash
pnpm install
pnpm db:up            # docker compose: Postgres :55432, Redis :6379, SeaweedFS S3 :8333
cp .env.example .env
pnpm db:migrate       # รัน db/migrations/*.sql ที่ยังไม่เคยรัน
pnpm start:dev        # API :4000 (PORT ใน .env) · health: /healthz, /readyz (ไม่มี prefix /api/v1)
pnpm start:worker     # worker BullMQ เปิดอีก terminal

pnpm typecheck && pnpm lint && pnpm test   # unit (*.spec.ts ข้างไฟล์ใน src/)
pnpm test:e2e                              # test/*.e2e-spec.ts ต้องเปิด db:up ก่อน
pnpm vitest run src/modules/polls/eligibility.spec.ts            # รัน unit test ไฟล์เดียว
pnpm vitest run --config vitest.config.e2e.ts test/polls.e2e-spec.ts   # รัน e2e ไฟล์เดียว
pnpm cunex:check      # ทดสอบต่อ CUNEX gateway จริงด้วยค่า CUNEX_* ใน .env
```

- เครื่องนี้อาจไม่มี `pnpm` ติดตั้ง ใช้ `npx pnpm@10 <script>` หรือ `corepack enable pnpm`
- `backend/README.md` เขียนว่า API อยู่ :3000 ซึ่งไม่ตรงแล้ว ค่าจริงคือ :4000 (เว็บใช้ :3000)
- e2e สร้างและใช้ DB `pollcunex_test` กับ Redis DB 15 แยกเอง (`test/e2e-env.ts`) รันทีละไฟล์ (`fileParallelism: false`) ทุกไฟล์ TRUNCATE ข้อมูลก่อนเริ่ม

### Frontend (`frontend/`)

```bash
bun install
cp .env.example .env.local   # BACKEND_URL=http://localhost:4000
bun dev                      # :3000
npx tsc --noEmit && npx eslint .
```

frontend ไม่มี test suite

### เปลี่ยน schema

1. เพิ่มไฟล์ `backend/db/migrations/NNNN_description.sql` (ห้ามแก้ migration ที่รันไปแล้ว)
2. `pnpm db:migrate`
3. `pnpm db:codegen` สร้าง `src/infra/database/db.d.ts` ใหม่จาก DB ที่รันอยู่ แล้ว commit ไฟล์นี้ด้วย (ห้ามแก้ไฟล์นี้ด้วยมือ)

## สถาปัตยกรรม

```
browser ──► Next.js :3000 ──/api/v1/*──► NestJS :4000 ──► Postgres · Redis · S3
                                              ▲
                                        worker (BullMQ): ปิดโพลตามเวลา, ลิงก์แชร์, แจ้งเตือน CUNEX
```

- **origin เดียว:** `frontend/next.config.ts` rewrite `/api/v1/*` ไปยัง `BACKEND_URL` ทำให้ cookie session `sid` (httpOnly) ใช้ได้ทั้งใน browser และ server component โดยไม่ต้องเปิด CORS และไม่มี bearer token
- **CSRF:** `OriginGuard` (`backend/src/common/origin.guard.ts`) ปฏิเสธ request ที่ไม่ใช่ GET ถ้า `Origin` ไม่ตรงกับ `APP_ORIGIN` ถ้าเรียก API ที่เปลี่ยนข้อมูลด้วย curl ต้องใส่ `-H 'Origin: http://localhost:3000'`

### Backend

- โค้ดชุดเดียวมี entry point 2 ตัว: `src/main.ts` (HTTP, `AppModule`) และ `src/worker.ts` (application context, `WorkerModule`) โดย `app.setup.ts` ใช้ร่วมกันระหว่าง `main.ts` กับ e2e test
- `src/modules/<feature>/` แต่ละ feature แบ่งเป็น controller → service → repository (Kysely ทั้งหมด ไม่มี ORM) ส่วน type ของ DB มาจาก `db.d.ts` ที่ generate (camelCase)
- **validation:** ใช้ zod schema ผ่าน `@Body({ schema })` / `@Query({ schema })` กับ `StandardSchemaValidationPipe` ถ้าไม่ผ่านจะได้ 422 ส่วน env ตรวจด้วย zod ใน `src/config/env.ts`
- **error:** ให้ throw `AppError(code, status, detail?)` (`src/common/errors.ts`) แล้วจะถูกแปลงเป็น RFC 9457 problem+json โดย `code` คือสัญญากับ frontend (ดู `docs/api-endpoints.md`) ถ้าเพิ่ม code ใหม่ ให้เพิ่มข้อความไทยใน `CODE_MESSAGES` ที่ `frontend/src/api/client.ts` ด้วย
- **สถานะโพล:** `draft → pending_review → approved → open → closed` (มี `rejected` ด้วย ซึ่งแก้แล้วส่งใหม่ได้) ร่างบันทึกทั้งก้อนด้วย `PUT /polls/:id` และใช้ `version` กัน conflict (`VERSION_CONFLICT`)
- **ความเป็นนิรนามของบัตร:** ตาราง `ballots` ไม่เก็บ `user_id` แต่ใช้ HMAC `voterKey(pepper, pollId, userId)` (`modules/ballots/voter-key.ts`) ถ้าเปลี่ยน `VOTER_KEY_PEPPER` ผู้ใช้จะแก้คำตอบเดิมไม่ได้ ส่วนผลแยกตามคณะ/ปีใช้ k-anonymity (`modules/results/k-anonymity.ts`) รวมกลุ่มเล็กเป็น "other"
- **คิวงาน:** `PollJobs` (`modules/polls/poll-jobs.ts`) ใส่งานหลัง DB commit โดยใช้ jobId ตายตัว (`opened-<id>`, `close-<id>`) เพื่อให้ทำซ้ำได้ปลอดภัย ถ้า Redis ล่ม API ยังเช็คเวลาปิดเองได้ ฝั่งที่รับงานไปทำคือ `polls.processor.ts` ใน worker
- **CUNEX:** `CUNEX_MODE=mock` ใช้ `mock-cunex.client.ts` (fixture: `eng-2567`, `med-2566`, `arts-2565`, `admin`) ล็อกอินที่ `/api/v1/auth/cunex/login?mockUser=med-2566` หรือ `POST /api/v1/auth/dev/login {"role":"admin"}` ถ้าเป็น `live` จะเรียก LLE gateway จริง ซึ่ง response ของ `/profile` ไม่ตรงกับเอกสาร LLE (ดู `docs/backend-guide.md` §3)
- รูปภาพ: client ขอ presigned URL จาก `POST /images/uploads` แล้วอัปโหลดตรงไปที่ S3 เอง ใน poll ต้องใช้ URL ที่ระบบออกให้เท่านั้น (`INVALID_IMAGE_URL`)

### Frontend

- **Next.js 16 ที่มี breaking changes** (`frontend/AGENTS.md`): ก่อนเขียนโค้ดให้อ่านเอกสารใน `node_modules/next/dist/docs/` ตัวอย่างเช่น middleware ตอนนี้คือ `proxy.ts` (ใช้กันหน้าที่ต้องล็อกอินโดยตรวจแค่ว่ามี cookie `sid` ส่วนสิทธิ์จริงตรวจที่ backend) และ `next dev` จะเขียน block ใน `AGENTS.md` กลับมาเองเสมอ
- ทุกการเรียก API ต้องผ่าน `src/api/` เท่านั้น ใน client component ใช้ `api` ส่วน server component ใช้ `getServerApi()` / `getMe()` / `loadOrNotFound()` จาก `src/api/server.ts` ซึ่งส่ง cookie ของผู้ใช้ต่อให้ endpoint อยู่ใน `endpoints.ts` และ type อยู่ใน `types.ts` (ต้องตรงกับ `backend/docs/api-endpoints.md`) แสดงข้อความ error ด้วย `errorMessage(err)`
- route group ใน `app/`: `(main)` สำหรับหน้าผู้ใช้/สร้างโพล/dashboard เจ้าของ, `(vote)` สำหรับหน้าตอบโพลและดูผล, `(private)/admin` สำหรับหน้าแอดมิน (ตรวจ role ซ้ำที่ server component)
- state ใช้ zustand ใน `src/store/` ส่วนร่างคำตอบที่ยังไม่ส่งเก็บใน browser (`src/lib/voteDraft.ts`) เพราะ backend ไม่เก็บ
- UI ใช้ shadcn (style `base-nova`, บน `@base-ui/react`) อยู่ใน `src/components/ui/` กับ Tailwind v4 และ alias `@/*` → `src/*` ข้อความที่ผู้ใช้เห็นเป็นภาษาไทย

## เอกสาร

- `backend/docs/api-endpoints.md` สัญญา API ฉบับเต็ม
- `backend/docs/frontend-migration.md` หน้าไหนเรียก API อะไร, ตารางแปลงชื่อ และ error code
- `backend/docs/backend-guide.md` ภาพรวม backend และ DB schema
