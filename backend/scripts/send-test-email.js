// ESM
import 'dotenv/config';
import nodemailer from 'nodemailer';

async function main() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `Quincho Alto Bonito <${user}>`;
  const to = process.env.SMTP_USER; // te lo envías a ti mismo

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    // logger: true,
    // debug: true,
  });

  if (process.argv.includes('--verify')) {
    try {
      await transporter.verify();
      console.log('✅ SMTP listo para enviar');
    } catch (e) {
      console.error('❌ verify() falló:', e);
      process.exit(1);
    }
    return;
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Prueba SMTP ✔',
      text: 'Hola, este es un correo de prueba desde el backend.',
      html: '<p>Hola, este es un <b>correo de prueba</b> desde el backend.</p>',
    });
    console.log('Mensaje enviado:', info.messageId);
  } catch (e) {
    console.error('Error enviando correo:', e);
    process.exit(1);
  }
}

main();
