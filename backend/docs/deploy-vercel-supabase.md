# Deploy: Vercel + Supabase + Upstash (free tier)

```
browser ─► Vercel: web (frontend/) ──/api/v1/*──► Vercel: api (backend/, serverless)
                                                     ├─► Supabase Postgres (transaction pooler)
                                                     ├─► Supabase Storage (S3 API) ← รูป
                                                     └─► Upstash Redis (rate limit, cache ผลโหวต) · session อยู่ใน Postgres
Supabase pg_cron ── ทุก 1 นาที ──► GET /api/v1/internal/tick  (แทน worker: ปิดโพล, ลิงก์แชร์, แจ้งเตือน)
```

ไม่มี worker บน Vercel จึงใช้ `JOBS_MODE=sweep` แทนคิว BullMQ

## 1. Supabase
1. สร้างโปรเจกต์ (region Singapore)
2. **Database → Connect**: คัดลอก connection string 2 แบบ ต่อท้ายทั้งคู่ด้วย `?uselibpqcompat=true&sslmode=require`
   - Transaction pooler (port 6543): ใช้เป็น `DATABASE_URL` ของ API
   - Session pooler (port 5432): ใช้รัน migration
3. รัน migration จากเครื่อง:
   ```bash
   DATABASE_URL='<session pooler URL>' pnpm --dir backend db:migrate
   ```
4. **Storage**: สร้าง bucket `pollcunex-images` แบบ **Public**
5. **Storage → Settings → S3 Connection**: เปิดใช้ แล้วสร้าง access key เก็บ endpoint, region, key id และ secret ไว้

## 2. Upstash
สร้าง Redis database (region Singapore) แล้วคัดลอก URL แบบ `rediss://default:<password>@<host>:6379`

## 3. Vercel: API (`backend/`)
New Project → import repo → **Root Directory = `backend`** (ไม่ต้องเลือก framework, `vercel.json` ตั้งค่าไว้แล้ว)

| env | ค่า |
|---|---|
| `APP_ENV` | `production` |
| `APP_ORIGIN` | URL ของเว็บ เช่น `https://cunex-poll.vercel.app` |
| `API_PUBLIC_URL` | URL ของเว็บ (ตัวเดียวกับ `APP_ORIGIN` เพราะเว็บส่ง `/api/v1` ต่อมาให้) |
| `LOG_LEVEL` | `info` |
| `DATABASE_URL` | Transaction pooler URL (port 6543) |
| `DATABASE_POOL_MAX` | `1` |
| `REDIS_URL` | URL จาก Upstash |
| `VOTER_KEY_PEPPER` | สุ่ม 32 ตัวขึ้นไป **ห้ามเปลี่ยนหลังเริ่มใช้** |
| `JOBS_MODE` | `sweep` |
| `CRON_SECRET` | สุ่ม 32 ตัวขึ้นไป |
| `S3_ENDPOINT` | endpoint S3 ของ Supabase (`https://<ref>.supabase.co/storage/v1/s3`) |
| `S3_REGION` | region ของโปรเจกต์ Supabase |
| `S3_BUCKET` | `pollcunex-images` |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | access key จาก Supabase |
| `S3_FORCE_PATH_STYLE` | `true` |
| `S3_PUBLIC_BASE_URL` | `https://<ref>.supabase.co/storage/v1/object/public/pollcunex-images` |
| `CUNEX_MODE` | `live` |
| `CUNEX_GATEWAY_URL` | `https://culab-svc.azurewebsites.net/Service.svc` |
| `CUNEX_CLIENT_ID` / `CUNEX_CLIENT_SECRET` | จากทีม CUNEX |
| `ADMIN_BOOTSTRAP_CUNEX_IDS` | CUNEX userId ของแอดมินคนแรก |

สุ่มค่าลับ: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`

เช็ค: `https://<api>.vercel.app/healthz` → `{"status":"ok"}`

## 4. Vercel: เว็บ (`frontend/`)
New Project → import repo เดิม → **Root Directory = `frontend`** (Next.js)

| env | ค่า |
|---|---|
| `BACKEND_URL` | URL ของโปรเจกต์ API เช่น `https://cunex-poll-api.vercel.app` |

ถ้าเปลี่ยน `BACKEND_URL` ต้อง redeploy เพราะ rewrite ถูกฝังตอน build

## 5. Cron (Supabase → SQL Editor)
```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('poll-tick', '* * * * *', $$
  select net.http_get(
    url := 'https://<api>.vercel.app/api/v1/internal/tick',
    headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
  );
$$);
```
เช็ค: `select * from net._http_response order by created desc limit 5;` ต้องเห็น status 200

## 6. Deploy อัตโนมัติจาก Git
ทั้งสองโปรเจกต์ผูกกับ repo บน GitHub แล้ว (Settings → Git)
- **Production Branch = `deploy/vercel-supabase`** push เข้า branch นี้ = ขึ้น production ทั้งเว็บและ API
- branch อื่นได้ preview URL แยก ใช้ดูหน้าตาได้อย่างเดียว (POST ถูก OriginGuard ปฏิเสธ เพราะ `APP_ORIGIN` เป็นโดเมน production)
- Root Directory: API = `backend`, เว็บ = `frontend`
- **มี migration ใหม่ ต้องรันก่อน push** (หัวข้อ 1 ข้อ 3) ไม่งั้นโค้ดใหม่จะขึ้นก่อนฐานข้อมูลพร้อม

## 7. CUNEX
แจ้งให้ตั้ง callback ของ CU Poll เป็น `https://<เว็บ>/api/v1/auth/cunex/callback`
