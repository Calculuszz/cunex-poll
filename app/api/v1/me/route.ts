import { requireUser, toMe } from '@/mock-api/auth'
import { json, route } from '@/mock-api/http'

export const GET = route(async () => json(toMe(await requireUser())))
