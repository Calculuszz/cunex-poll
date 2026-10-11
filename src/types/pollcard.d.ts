type PollStatus = "DRAFT" | "PENDING" | "APPROVED" | "VOTING" | "DONE";
type Scope = "A" | "B" | "C" | "D"

export interface IPollCard{
    type: PollStatus;
    scope: Scope;
    realtime: boolean;
    title: string;
    desc: string;
    question: number;
    closeTime: Date
}
