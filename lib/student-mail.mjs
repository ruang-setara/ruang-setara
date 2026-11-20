import nodemailer from 'nodemailer';

export function studentTemplate(reply = '', host) {
  const url = typeof host === 'string' && /^[a-z0-9.-]+$/i.test(host) ? `https://${host}/#aman` : '';
  const subject = 'Ada pesan baru untukmu dari RUANG SETARA';
  const intro = 'Terima kasih sudah mau bercerita. Admin sudah membalas pesanmu. Nggak perlu buru-buru, ya. Kamu bisa membacanya kapan pun kamu merasa siap.';
  const guide = 'Untuk melanjutkan percakapan, buka Ruang Aman dari perangkat dan browser yang kamu pakai saat bercerita.';
  const safe = String(reply).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return {subject, text:['Hai,',intro,reply && `Balasan admin:\n${reply}`,guide,url,'Salam hangat,\nTim RUANG SETARA'].filter(Boolean).join('\n\n'),
    html:`<div lang="id" style="max-width:520px;margin:auto;padding:28px;background:#fffaf2;color:#243d37;font:16px/1.6 Arial,sans-serif"><p style="font-size:13px;letter-spacing:2px">RUANG SETARA</p><h1 style="font-size:24px">Hai,</h1><p>${intro}</p>${reply ? `<div style="padding:16px;background:#edf3ed;border-left:3px solid #426554"><strong>Balasan admin</strong><br>${safe.replace(/\r?\n/g,'<br>')}</div>` : ''}<p>${guide}</p>${url ? `<p><a href="${url}" style="color:#245443">Buka Ruang Aman</a></p>` : ''}<p>Salam hangat,<br>Tim RUANG SETARA</p></div>`};
}

export async function notifyStudent(email, reply = '', env = process.env, createTransport = nodemailer.createTransport) {
  const to = typeof email === 'string' ? email.trim() : '';
  const [local] = to.split('@');
  if (to.length > 254 || local.length > 64 || !/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(to)) return 'skipped';
  const user = env.GMAIL_USER?.trim();
  const pass = env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
  if (!user || !pass) {
    console.warn('student_mail: Gmail SMTP belum dikonfigurasi');
    return 'unconfigured';
  }
  const transport = createTransport({host: 'smtp.gmail.com', port: 465, secure: true, auth: {user, pass}, connectionTimeout: 4000, greetingTimeout: 4000, socketTimeout: 6000});
  const message = {from: {name: 'RUANG SETARA', address: user}, to: {address: to, name: ''}, ...studentTemplate(reply, env.VERCEL_PROJECT_PRODUCTION_URL)};
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await transport.sendMail(message);
      return 'sent';
    } catch (err) {
      const transient = (err.responseCode >= 400 && err.responseCode < 500) || (!err.responseCode && ['ECONNECTION','ETIMEDOUT','EDNS','ESOCKET'].includes(err.code));
      console.warn('student_mail: SMTP gagal', {attempt, code: err.code, status: err.responseCode});
      if (!transient || attempt === 2) return 'failed';
      await new Promise(resolve => setTimeout(resolve, 350));
    }
  }
}
