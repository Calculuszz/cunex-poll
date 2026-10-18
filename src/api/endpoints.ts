import type { RequestOptions, Requester } from './client'
import type {
    AdminUser, Answer, AuditLog, Ballot, BallotDraft, CodeKind, CodePreset, Faculty, ImageMime, Me, Page, PollDetail, PollDraft,
    PollResults, PollStatus, PollSummary, ResponsePage, ResultDisplay, TextAnswerPage, UploadTicket, Uuid,
} from './types'

// ทุก endpoint ในสัญญา api-endpoints v1 · หนึ่งฟังก์ชันต่อหนึ่ง endpoint ชื่อ/ลำดับหัวข้อตามเอกสาร
export function makeApi(req: Requester) {
    const signal = (s?: AbortSignal): Pick<RequestOptions, 'signal'> => ({ signal: s })
    const poll = (id: Uuid) => `/polls/${encodeURIComponent(id)}`

    return {
        // §1 Auth & session (หน้า login ใช้ลิงก์ใน authUrls แทน เพราะเป็นการ redirect ทั้งหน้า)
        auth: {
            logout: () => req<void>('/auth/logout', { method: 'POST' }),
            devLogin: (role: 'user' | 'admin') => req<Me>('/auth/dev/login', { method: 'POST', body: { role } }),
        },
        me: () => req<Me>('/me'),

        // §2 Reference data
        faculties: () => req<Faculty[]>('/faculties'),

        // §3 Polls — browse
        polls: {
            feed: (q: { status?: 'open' | 'closed'; cursor?: string | null; limit?: number } = {}) =>
                req<Page<PollSummary>>('/polls', { query: q }),
            mine: (q: { status?: PollStatus; cursor?: string | null; limit?: number } = {}) =>
                req<Page<PollSummary>>('/me/polls', { query: q }),
            get: (id: Uuid) => req<PollDetail>(poll(id)),

            // §4 Polls — authoring (owner)
            create: (draft: PollDraft) => req<PollDetail>('/polls', { method: 'POST', body: draft }),
            // แทนที่ฉบับร่างทั้งก้อน ต้องส่ง version ล่าสุดที่มี (412 VERSION_CONFLICT ถ้ามีคนแก้ก่อน)
            save: (id: Uuid, version: number, draft: PollDraft) =>
                req<PollDetail>(poll(id), { method: 'PUT', body: draft, headers: { 'If-Match': String(version) } }),
            remove: (id: Uuid) => req<void>(poll(id), { method: 'DELETE' }),
            submit: (id: Uuid) => req<PollDetail>(`${poll(id)}/submit`, { method: 'POST' }),
            setClosesAt: (id: Uuid, closesAt: string) => req<PollDetail>(`${poll(id)}/closes-at`, { method: 'PATCH', body: { closesAt } }),
            setRealtime: (id: Uuid, showResultsRealtime: boolean) =>
                req<PollDetail>(`${poll(id)}/realtime`, { method: 'PATCH', body: { showResultsRealtime } }),
            publish: (id: Uuid) => req<PollDetail>(`${poll(id)}/publish`, { method: 'POST' }),
            setResultDisplay: (id: Uuid, display: ResultDisplay) =>
                req<ResultDisplay>(`${poll(id)}/result-display`, { method: 'PUT', body: display }),
            close: (id: Uuid, reason?: string) => req<PollDetail>(`${poll(id)}/close`, { method: 'POST', body: reason ? { reason } : {} }),

            // §7 Results
            results: (id: Uuid, breakdown: 'none' | 'faculty' | 'year' = 'none', s?: AbortSignal) =>
                req<PollResults>(`${poll(id)}/results`, { query: { breakdown: breakdown === 'none' ? null : breakdown }, ...signal(s) }),
            textAnswers: (id: Uuid, elementId: Uuid, cursor?: string | null, limit = 20) =>
                req<TextAnswerPage>(`${poll(id)}/results/text`, { query: { elementId, cursor, limit } }),

            // [เสนอเพิ่ม] คำตอบรายชุด · withIdentity ขอรหัสผู้ตอบ (server ตัดสินว่าให้ไหม)
            responses: (id: Uuid, q: { cursor?: string | null; limit?: number; withIdentity?: boolean } = {}) =>
                req<ResponsePage>(`${poll(id)}/responses`, { query: { cursor: q.cursor, limit: q.limit, withIdentity: q.withIdentity ? 1 : null } }),
        },

        // §5 Images
        images: {
            requestUpload: (mimeType: ImageMime, byteSize: number, s?: AbortSignal) =>
                req<UploadTicket>('/images/uploads', { method: 'POST', body: { mimeType, byteSize }, ...signal(s) }),
        },

        // §6 Ballots
        ballot: {
            get: (id: Uuid) => req<Ballot>(`${poll(id)}/ballot`),
            put: (id: Uuid, ballot: Pick<Ballot, 'answers'>) => req<Ballot>(`${poll(id)}/ballot`, { method: 'PUT', body: ballot }),
            // [เสนอเพิ่ม] ballot ใหม่ของโพลที่ลงคะแนนซ้ำได้ · clientToken เดิม = ครั้งเดิม ไม่นับซ้ำ
            post: (id: Uuid, answers: Answer[], clientToken: string) =>
                req<Ballot>(`${poll(id)}/ballots`, { method: 'POST', body: { answers, clientToken } }),
            // [เสนอเพิ่ม] ฉบับร่างคำตอบที่ server
            getDraft: (id: Uuid) => req<BallotDraft>(`${poll(id)}/ballot/draft`),
            putDraft: (id: Uuid, answers: Answer[], opts: { keepalive?: boolean } = {}) =>
                req<BallotDraft>(`${poll(id)}/ballot/draft`, { method: 'PUT', body: { answers }, keepalive: opts.keepalive }),
        },

        // [เสนอเพิ่ม] preset รายชื่อรหัสของผู้ใช้
        presets: {
            list: () => req<CodePreset[]>('/me/presets'),
            create: (preset: { name: string; codeKind: CodeKind; codes: string[] }) => req<CodePreset>('/me/presets', { method: 'POST', body: preset }),
            rename: (id: Uuid, name: string) => req<CodePreset>(`/me/presets/${encodeURIComponent(id)}`, { method: 'PATCH', body: { name } }),
            remove: (id: Uuid) => req<void>(`/me/presets/${encodeURIComponent(id)}`, { method: 'DELETE' }),
        },

        // §8 Admin
        admin: {
            polls: (q: { status?: PollStatus; cursor?: string | null; limit?: number } = {}) =>
                req<Page<PollSummary>>('/admin/polls', { query: q }),
            approve: (id: Uuid) => req<PollDetail>(`/admin${poll(id)}/approve`, { method: 'POST' }),
            reject: (id: Uuid, comment?: string) => req<PollDetail>(`/admin${poll(id)}/reject`, { method: 'POST', body: comment ? { comment } : {} }),
            takedown: (id: Uuid, reason: string) => req<PollDetail>(`/admin${poll(id)}/takedown`, { method: 'POST', body: { reason } }),
            admins: () => req<AdminUser[]>('/admin/admins'),
            addAdmin: (studentId: string) => req<AdminUser[]>('/admin/admins', { method: 'POST', body: { studentId } }),
            removeAdmin: (userId: Uuid) => req<void>(`/admin/admins/${encodeURIComponent(userId)}`, { method: 'DELETE' }),
            auditLogs: (q: { entityType?: string; entityId?: string; cursor?: string | null } = {}) =>
                req<Page<AuditLog>>('/admin/audit-logs', { query: q }),
        },
    }
}

export type Api = ReturnType<typeof makeApi>
