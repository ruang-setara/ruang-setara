import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { pgSchema, text, jsonb } from 'drizzle-orm/pg-core'
import { eq } from 'drizzle-orm'
export const pool = new Pool({connectionString:process.env.DATABASE_URL, options:'-c search_path=ruang_setara_copy', max:3, connectionTimeoutMillis:8000})
export const db = drizzle(pool)
const schema = pgSchema('ruang_setara_copy')
export const entries = schema.table('entries',{userId:text('userId'),kind:text('kind'),id:text('id'),data:jsonb('data')})
const users = schema.table('user',{id:text('id'),email:text('email')})
export async function ownerId(){const [owner]=await db.select({id:users.id}).from(users).where(eq(users.email,'kesos23@admin.invalid'));return owner?.id}
