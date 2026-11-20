import { adminId } from '@/lib/auth'
import { db,entries } from '@/lib/copy-db'
export async function PUT(req){
  if(req.headers.get('sec-fetch-site')==='cross-site'||!req.headers.get('content-type')?.startsWith('application/json'))return new Response(null,{status:403})
  const userId=await adminId(req);if(!userId)return new Response(null,{status:401})
  const body=await req.json().catch(()=>null);const data=body?.data
  if(!data||Array.isArray(data)||typeof data!=='object'||JSON.stringify(data).length>2000000)return new Response(null,{status:400})
  await db.insert(entries).values({userId,kind:'content',id:'site',data}).onConflictDoUpdate({target:[entries.userId,entries.kind,entries.id],set:{data}})
  return Response.json({ok:true})
}
