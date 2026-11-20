import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth'
const handler = toNextJsHandler(auth)
async function dispatch(req){
  const path = new URL(req.url).pathname
  if (!['/api/auth/sign-in/email','/api/auth/sign-out','/api/auth/get-session'].includes(path)) return new Response(null,{status:404})
  if ((process.env.BETTER_AUTH_SECRET?.length || 0) < 32) return Response.json({error:'Konfigurasi sesi admin belum siap.'},{status:503})
  return handler[req.method](req)
}
export {dispatch as GET,dispatch as POST}
