import { randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import { Client } from 'pg'

const password = process.env.RUANG_ADMIN_INITIAL_PASSWORD
if (!password || password.length < 8 || password.length > 128) throw new Error('Kata sandi awal harus 8–128 karakter.')
const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8000 })
await client.connect()
try {
  await client.query('BEGIN')
  const id = randomUUID()
  const result = await client.query('INSERT INTO ruang_setara_copy."user" (id, name, email) VALUES ($1,$2,$3) ON CONFLICT (email) DO NOTHING RETURNING id', [id,'KESOS23','kesos23@admin.invalid'])
  if (result.rowCount) await client.query('INSERT INTO ruang_setara_copy.account (id,"accountId","userId","providerId",password) VALUES ($1,$2,$2,$3,$4)', [randomUUID(),id,'credential',await hashPassword(password)])
  await client.query('COMMIT')
  console.log(result.rowCount ? 'Akun admin dibuat.' : 'Akun admin sudah ada; kata sandi tidak diubah.')
} catch (error) {
  await client.query('ROLLBACK'); throw error
} finally { await client.end() }
