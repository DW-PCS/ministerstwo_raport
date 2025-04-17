'use client'
import { signIn, signOut, useSession } from "next-auth/react";


const Login = () => {
    const { data: session, status } = useSession();


    if (status === "loading") {
        return <div>Loading...</div>;
    }

    if (session) {
        return (
            <div>
                <h1>Welcome, {session.user?.name}</h1>
                <button onClick={() => signOut()}>Sign out</button>
            </div>
        );
    }

    return (
        <button className="px-4 py-2 rounded-md bg-blue-300 hover:bg-blue-400 duration-200 transition-colors cursor-pointer" onClick={() => signIn("azure-ad", { callbackUrl: 'https://oauth.pstmn.io/v1/callback' })}>
            Sign in with Azure
        </button>

    )
}

export default Login
