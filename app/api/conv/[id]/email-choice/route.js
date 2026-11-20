import { Pool } from 'pg'

let pool
export async function POST(request, { params }) {
  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!/^[0-9a-f]{36}$/.test(id) || typeof body?.include !== 'boolean' || typeof body?.email !== 'string' || !body.email || body.email.length > 254) return Response.json({error:'Pilihan tidak valid.'}, {status:400})
  try {
    pool ??= new Pool({connectionString:process.env.RUANG_SETARA_DATABASE_URL, max:3, connectionTimeoutMillis:5000, statement_timeout:8000})
    const result = await pool.query(`INSERT INTO settings (key,value) SELECT 'reply-email:' || c.id, CASE WHEN $3::boolean THEN to_jsonb(c.email) ELSE 'false'::jsonb END FROM convs c WHERE c.id=$1 AND c.email=$2 ON CONFLICT (key) DO UPDATE SET value=excluded.value`,[id,body.email,body.include])
    if (!result.rowCount) return Response.json({error:'Percakapan tidak ditemukan.'},{status:404})
    return Response.json({ok:true})
  } catch {return Response.json({error:'Pilihan belum tersimpan.'},{status:503})}
}
