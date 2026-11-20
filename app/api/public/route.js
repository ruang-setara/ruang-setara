import { db, entries, ownerId } from '@/lib/copy-db'
import { and,eq,inArray } from 'drizzle-orm'
export async function GET(){const id=await ownerId();const rows=await db.select().from(entries).where(and(eq(entries.userId,id),inArray(entries.kind,['content','story'])));return Response.json({content:rows.find(x=>x.kind==='content')?.data||null,stories:rows.filter(x=>x.kind==='story'&&x.data.status==='Published').map(x=>x.data)})}
