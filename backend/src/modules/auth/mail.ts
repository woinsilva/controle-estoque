import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

function createTransporter() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass || !env.smtpFrom) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });
}

export async function sendClientActivationEmail(input: {
  to: string;
  name: string;
  activationUrl: string;
}) {
  const transporter = createTransporter();

  if (!transporter) {
    logger.warn(
      {
        email: input.to,
        activationUrl: input.activationUrl
      },
      'SMTP not configured. Activation email not sent; using logged activation link.'
    );
    return;
  }

  await transporter.sendMail({
    from: env.smtpFrom,
    to: input.to,
    subject: 'Ative sua conta',
    html: `
      <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
        <h2>Ative sua conta</h2>
        <p>Ola, ${input.name}.</p>
        <p>Seu cadastro foi criado. Clique no link abaixo para confirmar seu email e definir sua senha:</p>
        <p><a href="${input.activationUrl}">${input.activationUrl}</a></p>
        <p>Se voce nao solicitou este acesso, ignore este email.</p>
      </div>
    `
  });

  logger.info({ email: input.to }, 'Client activation email sent.');
}
