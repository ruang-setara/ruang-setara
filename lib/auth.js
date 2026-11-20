import { betterAuth } from 'better-auth'
import { pool } from './copy-db'
const env = process.env
const dev = env.NODE_ENV === 'development'
const production = [env.VERCEL_PROJECT_PRODUCTION_URL, env.VERCEL_URL].filter(Boolean).map(host => `https://${host}`)
export const auth = betterAuth({
  database: pool,
  baseURL: env.BETTER_AUTH_URL || production[0] || env.V0_RUNTIME_URL || 'http://localhost:3000',
  trustedOrigins: dev ? ['http://localhost:3000', env.V0_RUNTIME_URL, env.V0_DEV_APP_URL, env.V0_BUILD_URL, env.V0_SANDBOX_URL].filter(Boolean) : production,
  emailAndPassword: { enabled: true, disableSignUp: true },
  session: { expiresIn: 86400, updateAge: 3600 },
  ...(dev ? { advanced: { defaultCookieAttributes: { sameSite: 'none', secure: true } } } : {})
})
export async function adminId(request) {
  if (!request.headers.get('cookie') || (env.BETTER_AUTH_SECRET?.length || 0) < 32) return null
  const session = await auth.api.getSession({headers: request.headers})
  return session?.user.email === 'kesos23@admin.invalid' ? session.user.id : null
}
