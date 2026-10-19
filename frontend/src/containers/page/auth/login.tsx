import { CardLogin } from "@/containers/page/auth/components/cardLogin"

export function LoginPage({ returnTo, error }: { returnTo: string; error: string | null }) {
    return (
        <div className="flex h-svh w-screen overflow-hidden items-center justify-center">
            <div className=" relative w-full flex items-center justify-center">
                <h1 className="absolute w-full text-center -top-20 font-heading text-3xl font-bold">CUNEX Voting</h1>
                <CardLogin returnTo={returnTo} error={error} />
            </div>
        </div>
    )
}
