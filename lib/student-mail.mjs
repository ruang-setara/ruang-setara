import { randomUUID } from 'node:crypto';

export function studentTemplate(reply = '', host) {
  const url = typeof host === 'string' && /^[a-z0-9.-]+$/i.test(host) ? `https://${host}/#aman` : '';
  const subject = 'Ada pesan baru untukmu dari RUANG SETARA';
  const intro = 'Terima kasih sudah mempercayakan ceritamu kepada kami. Kami sudah membaca pesanmu dan menulis balasan untukmu. Kamu boleh membacanya pelan-pelan, kapan pun kamu siap.';
  const guide = reply ? 'Kalau ada yang ingin kamu ceritakan lagi, kamu bisa kembali ke Ruang Aman dari perangkat dan browser yang sama. Nggak harus sekarang, ya.' : 'Sesuai pilihan privasimu, isi balasan tidak ditampilkan di email ini. Kamu bisa membacanya di Ruang Aman dari perangkat dan browser yang kamu pakai saat bercerita.';
  const safe = String(reply).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return {subject, text:['Hai,',intro,reply && `Balasan admin:\n${reply}`,guide,url,'Salam hangat,\nTim RUANG SETARA'].filter(Boolean).join('\n\n'),
    html:`<div lang="id" style="max-width:520px;margin:auto;padding:28px;background:#fffaf2;color:#243d37;font:16px/1.6 Arial,sans-serif"><p style="font-size:13px;letter-spacing:2px">RUANG SETARA</p><h1 style="font-size:24px">Hai,</h1><p>${intro}</p>${reply ? `<div style="padding:16px;background:#edf3ed;border-left:3px solid #426554"><strong>Balasan admin</strong><br>${safe.replace(/\r?\n/g,'<br>')}</div>` : ''}<p>${guide}</p>${url ? `<p><a href="${url}" style="color:#245443">Buka Ruang Aman</a></p>` : ''}<p>Salam hangat,<br>Tim RUANG SETARA</p></div>`};
}

export async function notifyStudent(email, reply = '', env = process.env, send = fetch) {
  const to = typeof email === 'string' ? email.trim() : '';
  const [local] = to.split('@');
  if (to.length > 254 || local.length > 64 || !/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(to)) return 'skipped';
  const domain = env.RESEND_EMAIL_DOMAIN?.trim();
  if (!env.RESEND_API_KEY || !domain || !/^[a-z0-9.-]+$/i.test(domain)) return 'unconfigured';
  try {
    const response = await send('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(8000),
      headers: {Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID()},
      body: JSON.stringify({from: `RUANG SETARA <notifikasi@${domain}>`, to: [to], ...studentTemplate(reply, env.VERCEL_PROJECT_PRODUCTION_URL)})
    });
    if (!response.ok) return 'failed';
    return (await response.json()).id ? 'sent' : 'failed';
  } catch { return 'failed'; }
}
