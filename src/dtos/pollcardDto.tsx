type PollStatus = "DRAFT" | "PENDING" | "APPROVED" | "VOTING" | "DONE";
type Scope = "A" | "B" | "C"

export interface IPollCardDTO{
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
        type: raw.type,
        scope: raw.scope,
        realtime: raw.realtime,
        title: raw.title,
        desc: raw.desc,
        question: raw.question,
        closeTime: raw.close
    }
}
