export type PollStatus = "DRAFT" | "PENDING" | "APPROVED" | "VOTING" | "DONE" | "REJECTED";
export type Scope = "A" | "B" | "C" | "D"

export interface IPollCardDTO{
    id: string;
    type: PollStatus;
    scope: Scope;
    realtime: boolean;
    title: string;
    desc: string;
    question: number;
    closeTime: Date
}

export function toPollCardDTO(raw: any):IPollCardDTO{
    return {
        id: raw.id,
        type: raw.type,
        scope: raw.scope,
        realtime: raw.realtime,
        title: raw.title,
        desc: raw.desc,
        question: raw.question,
        closeTime: raw.close
    }
}
