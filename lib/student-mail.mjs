import nodemailer from 'nodemailer';

export async function notifyStudent(email, env = process.env, createTransport = nodemailer.createTransport) {
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
  const message = {from: {name: 'RUANG SETARA', address: user}, to: {address: to, name: ''}, subject: 'Ada balasan dari admin RUANG SETARA', text: 'Admin sudah membalas pesanmu. Buka Ruang Aman dari perangkat dan browser yang sama untuk membacanya.'};
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
