import { CardLogin } from "@/containers/page/auth/components/cardLogin"

export function LoginPage() {
    return (
        <div className="flex h-svh w-screen overflow-hidden items-center justify-center">
            <div className=" relative w-full flex items-center justify-center">
                <h1 className="absolute w-full text-center -top-20 font-heading text-3xl font-bold">CUNEX Voting</h1>
                <CardLogin/>
            </div>
        </div>
    )
}
