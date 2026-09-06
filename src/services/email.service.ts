import { logger } from '../config/logger';
import { isProd } from '../config/env';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

/**
 * Development provider: logs the email to the backend console instead of sending it.
 * Swap this for an SES / SendGrid / Postmark implementation of EmailProvider in production.
 */
class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    logger.info('[email:dev] outgoing email (not actually sent)', {
      to: message.to,
      subject: message.subject,
      // Body is printed to the console so developers can copy reset links locally.
      body: message.text,
    });
  }
}

class NoopEmailProvider implements EmailProvider {
  async send(): Promise<void> {
    logger.warn('[email] no email provider configured; message dropped');
  }
}

export const emailProvider: EmailProvider = isProd
  ? new NoopEmailProvider()
  : new ConsoleEmailProvider();

export async function sendPasswordResetEmail(to: string, resetToken: string, resetUrl: string) {
  await emailProvider.send({
    to,
    subject: 'Reset your Period Tracker password',
    text:
      `We received a request to reset your password.\n\n` +
      `Reset link: ${resetUrl}?token=${resetToken}\n\n` +
      `This link expires soon. If you did not request this, you can safely ignore this email.`,
  });
}
