import { getPollResults } from '@/lib/pollResults'
import { getPollDetail } from '@/lib/polls'
import { applyDisplay, type VoterResultsPayload } from '@/lib/resultDisplay'
import { canViewResults, getMyResponse, getVoterPoll } from '@/lib/votes'

// ผลที่ผู้ตอบเห็น: ผ่านการตั้งค่าเผยแพร่ของเจ้าของแล้ว ข้อ/ตัวเลขที่ซ่อนถูกตัดตั้งแต่ตรงนี้ ไม่ส่งออกไปเลย
// คำตอบแบบข้อความไม่เคยส่งให้ผู้ตอบ (กันข้อความที่ระบุตัวตนได้หลุดถึงคนอื่น)
export async function getVoterResults(pollId: string, respondent: string): Promise<VoterResultsPayload | 'not_found' | 'forbidden'> {
    const poll = await getVoterPoll(pollId)
    if (!poll) return 'not_found'
    if (!canViewResults(poll, await getMyResponse(poll, respondent))) return 'forbidden'
    const [results, detail] = await Promise.all([getPollResults(pollId), getPollDetail(pollId)])
    if (!results || !detail) return 'not_found'
    return applyDisplay(results, detail.resultDisplay)
}
