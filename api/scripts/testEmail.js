/**
 * Checks the mailbox credentials and, if they work, sends one test email.
 * Run it with the same values you put in Vercel to find out why sending fails:
 *
 *   node api/scripts/testEmail.js you@example.com
 *
 * Reads EMAIL_HOST / EMAIL_PORT / EMAIL_USER / EMAIL_PASS from api/.env or the
 * environment. Nothing is printed except the host and user, never the password.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const nodemailer = require('nodemailer');

const host = process.env.EMAIL_HOST;
const port = Number(process.env.EMAIL_PORT) || 465;
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
const to = process.argv[2] || user;

function explain(err) {
  const text = `${err.code || ''} ${err.responseCode || ''} ${err.message}`.toLowerCase();
  if (text.includes('invalid login') || text.includes('535') || text.includes('authentication')) {
    return 'The mailbox rejected the username or password. Re-check EMAIL_USER (full address) and reset the mailbox password in hPanel, then update EMAIL_PASS.';
  }
  if (text.includes('enotfound') || text.includes('eai_again')) {
    return `EMAIL_HOST could not be resolved. It should be smtp.hostinger.com, currently "${host}".`;
  }
  if (text.includes('etimedout') || text.includes('econnrefused')) {
    return `Nothing answered on port ${port}. Try EMAIL_PORT=587, or check that outbound SMTP is not blocked.`;
  }
  if (text.includes('missing credentials') || text.includes('no auth')) {
    return 'EMAIL_USER or EMAIL_PASS is empty. Check for a stray space or quote around the value.';
  }
  if (text.includes('wrong version number') || text.includes('ssl')) {
    return `TLS mismatch: port 465 needs secure:true, port 587 needs secure:false. Currently port ${port}.`;
  }
  return 'See the raw error above.';
}

async function main() {
  console.log('host :', host || '(not set — would fall back to Gmail)');
  console.log('port :', port, port === 465 ? '(implicit TLS)' : '(STARTTLS)');
  console.log('user :', user || '(not set)');
  console.log('pass :', pass ? `set, ${pass.length} characters` : '(not set)');
  console.log('to   :', to);
  console.log('');

  if (!user || !pass) {
    console.error('EMAIL_USER and EMAIL_PASS must both be set.');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport(
    host
      ? { host, port, secure: port === 465, auth: { user, pass } }
      : { service: 'gmail', auth: { user, pass } }
  );

  try {
    await transporter.verify();
    console.log('✅ Login accepted by the mail server');
  } catch (err) {
    console.error('❌ Login failed:', err.message);
    console.error('\n→', explain(err));
    process.exit(1);
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Pacific Duct Pros" <${user}>`,
      to,
      subject: 'Pacific Duct Pros — test email',
      text: 'If you are reading this, the website can send email from this mailbox.',
    });
    console.log('✅ Test email accepted for delivery:', info.messageId);
    console.log('\nCheck the inbox (and the spam folder) of', to);
  } catch (err) {
    console.error('❌ Sending failed:', err.message);
    console.error('\n→', explain(err));
    process.exit(1);
  }
}

main();
