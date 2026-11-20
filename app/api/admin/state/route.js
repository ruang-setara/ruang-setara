import { adminId } from '@/lib/auth'
import { db, entries } from '@/lib/copy-db'
import { eq } from 'drizzle-orm'
export async function GET(req){
  const id=await adminId(req)
  if (!id) return Response.json({error:'Silakan masuk kembali.'},{status:401})
  const rows=await db.select().from(entries).where(eq(entries.userId,id))
  const list=kind=>rows.filter(x=>x.kind===kind).map(x=>x.data)
  return Response.json({convs:list('conv'),stories:list('story'),leads:list('lead'),emails:list('emails')[0]||[],mailOn:Boolean(process.env.RESEND_API_KEY && process.env.RESEND_EMAIL_DOMAIN)},{headers:{'Cache-Control':'private, no-store'}})
}
