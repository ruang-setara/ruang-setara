import { Pool } from 'pg'
import { notifyStudent } from '../../../../../../lib/student-mail.mjs'

export const runtime = 'nodejs'
export const maxDuration = 60
let pool
const error = (message, status) => Response.json({error: message}, {status})

export async function POST(request, {params}) {
  const token = /^Bearer ([0-9a-f]{64})$/.exec(request.headers.get('authorization') || '')?.[1]
  if (!token) return error('Sesi admin tidak valid.', 401)
  const {id} = await params
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(id)) return error('ID percakapan tidak valid.', 400)
  const b = await request.json().catch(() => null)
  const t = typeof b?.t === 'string' ? b.t.trim() : ''
  if (!t || t.length > 2000) return error('Isi balasan harus 1–2000 karakter.', 400)
  if (!process.env.RUANG_SETARA_DATABASE_URL) return error('Koneksi ke database RUANG SETARA belum diatur di proyek ini. Balasan belum disimpan.', 503)
  let row
  try {
    pool ??= new Pool({connectionString: process.env.RUANG_SETARA_DATABASE_URL, max: 3, connectionTimeoutMillis: 5000, statement_timeout: 8000})
    const result = await pool.query(`WITH admin_session AS (
      SELECT 1 FROM sessions WHERE token = $1 AND expires_at > now()
    ), saved AS (
      UPDATE convs c SET thread = (
        SELECT jsonb_agg(item ORDER BY idx) FROM (
          SELECT item, idx FROM jsonb_array_elements(c.thread || jsonb_build_array($3::jsonb)) WITH ORDINALITY AS m(item,idx)
          ORDER BY idx DESC LIMIT 300
        ) recent
      ), status='Replied', unread_a=false, unread_u=true, updated_at=now()
      WHERE c.id=$2 AND EXISTS (SELECT FROM admin_session) RETURNING c.id,c.email
    ) SELECT EXISTS (SELECT FROM admin_session) AS authorized, saved.id,saved.email, EXISTS (SELECT FROM settings WHERE key='reply-email:' || saved.id AND value=to_jsonb(saved.email)) AS include_reply FROM (SELECT 1) anchor LEFT JOIN saved ON true`,
      [token, id, JSON.stringify({f:'a', t, time:String(b.time ?? '').slice(0,20), ts:Date.now()})])
    row = result.rows[0]
  } catch {
    console.warn('admin_reply: database unavailable')
    return error('Status penyimpanan belum bisa dipastikan. Muat ulang percakapan sebelum mencoba lagi.', 503)
  }
  if (!row.authorized) return error('Sesi admin berakhir, silakan masuk lagi.', 401)
  if (!row.id) return error('Percakapan tidak ditemukan.', 404)
  const notification = await notifyStudent(row.email, row.include_reply === true ? t : '').catch(() => {console.warn('student_mail: pengiriman gagal');return 'failed'})
  return Response.json({ok:true, notification})
}
