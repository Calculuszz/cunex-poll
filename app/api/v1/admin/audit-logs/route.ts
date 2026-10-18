import { requireAdmin } from '@/mock-api/auth'
import { db } from '@/mock-api/db'
import { json, pageParams, route, toPage } from '@/mock-api/http'

export const GET = route(async (request) => {
    await requireAdmin()
    const { url, limit, offset } = pageParams(request)
    const { rows } = await db.query(
        `SELECT id, actor_id AS "actorId", action, entity_type AS "entityType", entity_id AS "entityId", data, created_at AS "createdAt"
         FROM audit_logs
         WHERE ($1::text IS NULL OR entity_type = $1) AND ($2::text IS NULL OR entity_id = $2)
         ORDER BY created_at DESC, id LIMIT $3 OFFSET $4`,
        [url.searchParams.get('entityType'), url.searchParams.get('entityId'), limit + 1, offset],
    )
    return json(toPage(rows, limit, offset))
})
