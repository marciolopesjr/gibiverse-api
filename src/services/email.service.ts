// src/services/email.service.ts
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const EmailService = {
  async sendMail({ to, subject, text, html }: SendMailOptions) {
    // Configuração de transporte
    // Se estiver em produção, espera variáveis de ambiente SMTP reais.
    // Se não, cria uma conta de teste no Ethereal.
    let transporter;

    if (process.env.NODE_ENV === 'production') {
      if (!process.env.SMTP_HOST) {
        logger.warn('SMTP_HOST não configurado. Emails não serão enviados em produção.');
        return;
      }
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Modo DEV: Ethereal
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const info = await transporter.sendMail({
      from: '"Gibiverse Support" <noreply@gibiverse.com>',
      to,
      subject,
      text,
      html: html || text,
    });

    logger.info(`Email enviado: ${info.messageId}`);

    // Se estiver usando Ethereal, loga a URL de preview para o dev clicar
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  },
};