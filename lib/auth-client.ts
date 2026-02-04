import { createAuthClient } from "better-auth/react"
import { emailOTPClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
    plugins: [
        emailOTPClient()
    ],
    baseURL: process.env.BETTER_AUTH_URL
})

