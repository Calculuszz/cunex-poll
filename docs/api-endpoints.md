# CUNEX Poll — API endpoints (v1)

Base path: `/api/v1` · JSON in/out · times are ISO-8601 UTC.

## Conventions

| Topic | Rule |
|---|---|
| Auth | Session in an httpOnly, `Secure`, `SameSite=Lax` cookie (`sid`), backed by Redis. No bearer tokens. |
| CSRF | All non-GET requests must send `Origin` matching the app origin (checked server-side). |
| Errors | `application/problem+json` (RFC 9457): `{ type, title, status, detail, code }`. `code` is a stable machine id, e.g. `POLL_LOCKED`. |
| Pagination | Cursor based: `?limit=20&cursor=<opaque>` → `{ items, nextCursor }`. |
| Concurrency | Draft saves send `If-Match: <version>`; stale versions return `412 VERSION_CONFLICT`. |
| Rate limits | Per session + per IP in Redis. OTP and ballot endpoints have stricter limits. `429` with `Retry-After`. |
| Visibility | A poll that the caller may not see returns `404` (not `403`), so poll ids can't be probed. |

Roles: **anon** (no session) · **user** (any login) · **verified** (logged in via CUNEX at least once) · **owner** (created the poll) · **admin**.

---

## 1. Auth & session

| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/auth/cunex/login?returnTo=` | anon | 302 to the CUNEX "login with CUNEX" page. |
| GET | `/auth/cunex/callback?token=&returnTo=` | anon | Exchange CUNEX token via `/profile`, upsert user + faculty, create session, **302 to `returnTo` without the token**. Also the entry URL CUNEX opens from its menu, notifications and UniversalLinks. |
| GET | `/auth/google/login?returnTo=` | anon | 302 to Google OIDC (PKCE + state in Redis). |
| GET | `/auth/google/callback` | anon | Finish OIDC, create session, 302. |
| POST | `/auth/email/otp` | anon | `{ email }` → `204`. Sends a 6-digit code (TTL 10 min, 5 attempts). Always `204`, even for unknown emails. |
| POST | `/auth/email/verify` | anon | `{ email, code }` → `200 Me` + session cookie. |
| POST | `/auth/logout` | user | Delete session → `204`. |
| POST | `/auth/dev/login` | anon | `{ role: "user" \| "admin" }` → test accounts popup. **Only mounted when `APP_ENV != production`.** |
| GET | `/me` | user | `Me` |

`returnTo` must be a relative path (`/polls/…`); anything else falls back to `/`.

```jsonc
// Me
{ "id": "uuid", "role": "user", "isChulaVerified": true,
  "faculty": { "code": "21", "nameTh": "วิศวกรรมศาสตร์", "nameEn": "Engineering" },
  "studentYear": 2567, "providers": ["cunex"] }
```

## 2. Reference data

| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/faculties` | user | All faculties (for the audience picker). Cached. |

## 3. Polls — browse

| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/polls?status=open\|closed&cursor=` | user | The "หน้ารวม" feed: polls with `listedPublicly=true` that the caller is eligible for. Includes `myBallot` status per item. |
| GET | `/me/polls?status=&cursor=` | user | Polls I created, any status. |
| GET | `/polls/:pollId` | user | Poll detail. Voters see open/closed polls they are eligible for; owner and admins see every status. `review` history only for owner/admin. |

```jsonc
// PollDetail
{ "id": "uuid", "status": "open", "version": 7,
  "title": "…", "description": "…", "coverImageId": "uuid",
  "closesAt": "2026-10-20T10:00:00Z", "submittedAt": "…", "openedAt": "…", "closedAt": null,
  "audience": { "type": "restricted", "rules": [{ "facultyCode": "21", "studentYear": null }] },
  "settings": { "showResultsRealtime": false, "allowAnswerEdit": true, "listedPublicly": true },
  "shareUrl": "https://cunex.page.link/…",
  "elements": [ /* Element[], ordered */ ],
  "myBallot": { "submitted": true, "canEdit": true },
  "canViewResults": false,
  "isOwner": false,
  "reviews": [{ "decision": "rejected", "comment": "…", "createdAt": "…" }] }  // owner/admin only
```

Lists return `{ items: PollSummary[], nextCursor }`; `PollSummary` is the poll without
`elements`, `audience.rules` and `settings` (the feed adds `myBallot`).

## 4. Polls — authoring (owner)

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/polls` | user | Create a draft. Body = `PollDraft` (all fields optional). → `201 PollDetail` |
| PUT | `/polls/:pollId` | owner | Replace the whole draft (settings + audience + ordered elements + options) in one transaction. Only in `draft`/`rejected`. Needs `If-Match: <version>` (`428` if missing, `412 VERSION_CONFLICT` + `currentVersion` if stale). → `200 PollDetail` |
| DELETE | `/polls/:pollId` | owner | Soft delete. Only `draft`/`rejected`. → `204` |
| POST | `/polls/:pollId/submit` | owner | Validate completeness → `pending_review`. `422 POLL_INCOMPLETE` with `problems: [{ path, message }]` listing every problem. |
| PATCH | `/polls/:pollId/closes-at` | owner | `{ closesAt }`, the only edit allowed after submit (`pending_review` or `open`). Must be in the future. |
| POST | `/polls/:pollId/close` | owner | Close early → `closed`. Only from `open`. |

The Preview mode screen uses `GET /polls/:pollId`, which returns any status to the owner.

Notes:
- Element and option ids are regenerated on every `PUT` (drafts have no ballots yet); don't cache them across saves.
- `422 UNKNOWN_FACULTY` (`facultyCodes`) when an audience rule names a faculty not in `GET /faculties`.
- `422 INVALID_IMAGE` (`imageIds`) when an image isn't yours or hasn't finished uploading.
- Wrong status for the action → `409 POLL_LOCKED` with `pollStatus`.

**Why one `PUT` for the whole draft, not per-element CRUD:** the editor is a single form saved with "บันทึกฉบับร่าง". Reorder ("swipe"), add and remove all happen client-side, and one transactional replace avoids partially saved drafts and position conflicts. Drafts are small (tens of elements).

```jsonc
// PollDraft
{ "title": "…", "description": "…", "coverImageId": "uuid", "closesAt": "…",
  "audience": { "type": "public" } | { "type": "restricted", "rules": [{ "facultyCode": "21", "studentYear": 2567 }] },
  "settings": { "showResultsRealtime": false, "allowAnswerEdit": true, "listedPublicly": true },
  "elements": [
    { "type": "single_choice", "title": "อยากให้ธีมงานปีนี้เป็นแบบไหน", "isRequired": true,
      "config": { "layout": "list" },
      "options": [
        { "label": "ย้อนยุคสยาม", "description": null, "imageId": null, "popup": null },
        { "label": "แสงสีร่วมสมัย", "popup": { "buttonText": "ดูรายละเอียด", "title": "…", "body": "…" } } ] },
    { "type": "page_break" },
    { "type": "text_question", "title": "ข้อเสนอแนะ", "config": { "placeholder": "…", "maxLength": 500 } },
    { "type": "image", "config": { "imageId": "uuid", "caption": "…" } }
  ] }
```

Element `config` per type (validated with a zod discriminated union on `type`):

| type | config | options |
|---|---|---|
| `text_question` | `{ placeholder?, maxLength? (≤5000) }` | — |
| `single_choice` | `{ layout: "list" \| "grid" }` | 2–50 |
| `multi_choice` | `{ layout, minSelect?, maxSelect? }` | 2–50 |
| `dropdown` | `{}` | 2–200 |
| `description` | `{ showHeading, sections: [{ heading?, body }] }` | — |
| `image` | `{ imageId, caption? }` | — |
| `info_popup` | `{ buttonText, title, body }` | — |
| `accordion` | `{ title, body }` | — |
| `page_break` | `{}` | — |

## 5. Images

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/images/uploads` | user | `{ mimeType: "image/jpeg"\|"image/png"\|"image/webp", byteSize }` → `{ imageId, upload: { url, fields } }` (S3 presigned POST, size-capped). |
| POST | `/images/:imageId/complete` | owner of image | Server checks the object (type, size, dimensions) → `ready`. |
| POST | `/images/import` | user | `{ url }` → `202 { imageId, status: "pending" }`. The worker downloads it (https only, size and type limits, blocks private IPs). |
| GET | `/images/:imageId` | owner of image | `{ id, status, url? }`, polled while an import is pending. |

## 6. Ballots

| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/polls/:pollId/ballot` | user | My current answers (looked up by `voter_key`) → `200 Ballot` or `404`. Used to prefill when editing. |
| PUT | `/polls/:pollId/ballot` | user | Submit or replace my answers. `201` first time, `200` on edit. |

`PUT` because the operation is an idempotent upsert of *my* ballot. Errors:

| Status | code | When |
|---|---|---|
| 404 | `POLL_NOT_FOUND` | not visible / not eligible |
| 409 | `POLL_CLOSED` | status ≠ open **or** now ≥ `closesAt` |
| 409 | `ALREADY_VOTED` | ballot exists and `allowAnswerEdit=false` |
| 403 | `NOT_ELIGIBLE` | restricted poll and caller's faculty/year doesn't match (or not CUNEX-verified) |
| 422 | `INVALID_ANSWERS` | missing required, option not in element, too many selections, … (lists each) |

```jsonc
// Ballot (request and response)
{ "answers": [
    { "elementId": "uuid", "optionIds": ["uuid"] },
    { "elementId": "uuid", "text": "ดีมาก" } ],
  "submittedAt": "2026-10-05T03:12:00Z" }   // response only, minute precision
```

## 7. Results

| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/polls/:pollId/results?breakdown=none\|faculty\|year` | owner, admin, or voter when allowed* | Tallies per option + total ballots. Served from a 3 s Redis cache, `ETag` → `304`. |
| GET | `/polls/:pollId/results/text?elementId=&cursor=` | owner, admin | Free-text answers, newest first, without ballot ids. |

\* Voters can view results when `showResultsRealtime=true`, or once the poll is `closed`.

```jsonc
{ "totalBallots": 1243, "generatedAt": "…",
  "elements": [{ "elementId": "uuid", "answered": 1200,
    "options": [{ "optionId": "uuid", "count": 640 }],
    "breakdown": [{ "group": "21", "count": 300, "options": [ … ] },
                  { "group": "other", "hidden": true }] }] }   // groups below k are merged into "other"
```

## 8. Admin

| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/admin/polls?status=pending_review&cursor=` | admin | Review queue: `pending_review` oldest-submitted first; other statuses newest first. |
| POST | `/admin/polls/:pollId/approve` | admin | → `open`. Queues `poll-opened` (UniversalLink + notifications) and a delayed `close-poll` at `closesAt`. `422 CLOSES_AT_PASSED` if the deadline went by while pending. |
| POST | `/admin/polls/:pollId/reject` | admin | `{ comment }` (required) → `rejected`; owner sees it in `reviews` and can edit + resubmit. |
| POST | `/admin/polls/:pollId/takedown` | admin | `{ reason }`. Force-close an open/closed poll, hide it from the feed, cancel its close job. |
| GET | `/admin/admins` | admin | List admins (`id`, `cunexUserId`, `facultyCode`, `lastLoginAt`). |
| POST | `/admin/admins` | admin | `{ cunexUserId }`. Grant admin. `404 USER_NOT_FOUND` until that person has logged in once. |
| DELETE | `/admin/admins/:userId` | admin | Revoke admin. `409 CANNOT_REVOKE_SELF` for yourself. The role is re-read on every request, so it applies immediately. |
| GET | `/admin/audit-logs?entityType=&entityId=&cursor=` | admin | Audit trail, newest first. |

All admin routes return `403 FORBIDDEN` to non-admins. The first admins come from
`ADMIN_BOOTSTRAP_CUNEX_IDS`; after that, admins grant each other here.

## 9. Ops

| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | Liveness, process up. |
| GET | `/readyz` | Readiness: Postgres + Redis reachable. |

---

## Not exposed on purpose

- No endpoint returns `voter_key`, ballot ids, or who voted.
- No "list voters" / "who hasn't voted" for owners.
- Free-text answers are listed without ballot ids or timestamps, so they can't be joined with choices from the same ballot.
