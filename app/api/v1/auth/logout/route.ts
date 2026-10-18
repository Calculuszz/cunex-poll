import { endSession } from '@/mock-api/auth'
import { noContent, route } from '@/mock-api/http'

export const POST = route(async () => {
    await endSession()
    return noContent()
})
