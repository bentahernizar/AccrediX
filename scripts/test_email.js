const path = require('path');
const nodemailer = require('nodemailer');

try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch (e) {
  if (process.loadEnvFile) {
    try {
      process.loadEnvFile(path.join(__dirname, '../.env'));
    } catch (_) {}
  }
}

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '465');
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';

if (!smtpUser || !smtpPass) {
  console.error("ERREUR : SMTP_USER ou SMTP_PASS non défini dans le fichier .env");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: { user: smtpUser, pass: smtpPass },
  tls: { rejectUnauthorized: false }
});

transporter.sendMail({
  from: `"INEAS Accreditation" <${smtpUser}>`,
  to: 'abbb70121@gmail.com',
  subject: 'Test INEAS - Identifiants acces portail',
  text: 'Test SMTP INEAS.\n\nUsername: hopital_test\nMot de passe: Test1234\nAcces: http://localhost:3001/login.html',
  html: '<h2>Test INEAS</h2><p>Username: <b>hopital_test</b><br>Mot de passe: <b>Test1234</b></p>'
}).then(info => {
  console.log('EMAIL ENVOYE avec succes ! ID:', info.messageId);
  console.log('Accepte:', info.accepted);
  process.exit(0);
}).catch(err => {
  console.error('ERREUR:', err.message);
  process.exit(1);
});
