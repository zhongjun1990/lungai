// SendGrid Email Service
import sgMail from '@sendgrid/mail';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  attachments?: {
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
  }[];
}

export interface EmailTemplateParams {
  to: string | string[];
  subject: string;
  templateId: string;
  dynamicData?: Record<string, unknown>;
  attachments?: SendEmailParams['attachments'];
}

class EmailService {
  private initialized = false;

  private init(): void {
    if (!this.initialized) {
      if (!config.email.sendgridApiKey) {
        logger.warn('SendGrid API key not configured — email sending is disabled');
        return;
      }
      sgMail.setApiKey(config.email.sendgridApiKey);
      this.initialized = true;
      logger.info('SendGrid email service initialized');
    }
  }

  async send(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    this.init();

    if (!config.email.sendgridApiKey) {
      logger.warn('SendGrid not configured, skipping email send');
      return { success: false, error: 'SendGrid not configured' };
    }

    const msg = {
      to: params.to,
      from: params.from || {
        email: config.email.fromAddress,
        name: config.email.fromName,
      },
      replyTo: params.replyTo || config.email.replyToAddress,
      subject: params.subject,
      text: params.text,
      html: params.html,
      attachments: params.attachments,
    };

    try {
      const [response] = await sgMail.send(msg);
      const messageId = response.headers['x-message-id'] as string || '';
      logger.info(`Email sent successfully: ${messageId}`, {
        to: Array.isArray(params.to) ? params.to.join(',') : params.to,
        subject: params.subject,
      });
      return { success: true, messageId };
    } catch (error: unknown) {
      const err = error as { response?: { body?: { errors?: { message: string }[] } } };
      const errorMessage = err.response?.body?.errors?.[0]?.message || (error as Error).message;
      logger.error('Failed to send email:', error);
      return { success: false, error: errorMessage };
    }
  }

  async sendWithTemplate(params: EmailTemplateParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    this.init();

    if (!config.email.sendgridApiKey) {
      logger.warn('SendGrid not configured, skipping email send');
      return { success: false, error: 'SendGrid not configured' };
    }

    const toAddresses = Array.isArray(params.to)
      ? params.to.map(email => ({ email }))
      : [{ email: params.to }];

    const msg = {
      to: toAddresses,
      from: {
        email: config.email.fromAddress,
        name: config.email.fromName,
      },
      replyTo: config.email.replyToAddress,
      subject: params.subject,
      templateId: params.templateId,
      dynamicTemplateData: params.dynamicData,
      attachments: params.attachments,
    };

    try {
      const [response] = await sgMail.send(msg);
      const messageId = response.headers['x-message-id'] as string || '';
      logger.info(`Email sent via template successfully: ${messageId}`, {
        templateId: params.templateId,
        subject: params.subject,
      });
      return { success: true, messageId };
    } catch (error: unknown) {
      const err = error as { response?: { body?: { errors?: { message: string }[] } } };
      const errorMessage = err.response?.body?.errors?.[0]?.message || (error as Error).message;
      logger.error('Failed to send email via template:', error);
      return { success: false, error: errorMessage };
    }
  }

  // Cold outreach email for B2B hospital outreach
  async sendColdOutreach(params: {
    to: string;
    recipientName: string;
    hospitalName: string;
    ctaUrl?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { to, recipientName, hospitalName, ctaUrl } = params;
    const cta = ctaUrl || config.vercel.url || 'https://lungai.com/demo';

    return this.send({
      to,
      subject: `LungAI — AI Lung Nodule Detection for ${hospitalName}`,
      html: this.buildOutreachEmailHtml({ recipientName, hospitalName, ctaUrl: cta }),
      text: this.buildOutreachEmailText({ recipientName, hospitalName, ctaUrl: cta }),
    });
  }

  private buildOutreachEmailHtml(params: { recipientName: string; hospitalName: string; ctaUrl: string }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a2e;">
  <div style="text-align: center; padding: 40px 0;">
    <h1 style="color: #0066cc; font-size: 28px; margin: 0;">LungAI</h1>
    <p style="color: #666; font-size: 14px; margin: 8px 0 0;">AI-Powered Lung Nodule Detection</p>
  </div>

  <div style="background: #f8f9fa; border-radius: 12px; padding: 32px; margin: 20px 0;">
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
      Dear ${params.recipientName},
    </p>
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
      I am reaching out to introduce <strong>LungAI</strong>, an AI-powered lung nodule detection platform designed specifically for radiology departments like yours at <strong>${params.hospitalName}</strong>.
    </p>
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
      Our system analyzes CT scans to detect lung nodules with <strong>sensitivity ≥95%</strong> and <strong>specificity ≥90%</strong>, providing Lung-RADS standardized assessment and auto-generated reports to streamline your clinical workflow.
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
      Key benefits for ${params.hospitalName}:
    </p>
    <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #333;">
      <li>Reduce radiologist reading time by up to 40%</li>
      <li>Standardized Lung-RADS scoring for consistent reporting</li>
      <li>HIPAA-compliant cloud infrastructure</li>
      <li>Seamless integration with existing PACS systems</li>
    </ul>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${params.ctaUrl}" style="background: #0066cc; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
        Request a Demo
      </a>
    </div>
    <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.6;">
      I would be happy to schedule a 20-minute call to discuss how LungAI can support ${params.hospitalName}'s radiology team.
    </p>
  </div>

  <div style="text-align: center; padding: 24px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
    <p style="margin: 0 0 8px;"><strong>LungAI</strong> — AI Medical Imaging SaaS Platform</p>
    <p style="margin: 0;">This email was sent as part of a cold outreach initiative. If you would prefer not to receive future emails, please reply with "unsubscribe."</p>
  </div>
</body>
</html>`;
  }

  private buildOutreachEmailText(params: { recipientName: string; hospitalName: string; ctaUrl: string }): string {
    return `Dear ${params.recipientName},

I am reaching out to introduce LungAI, an AI-powered lung nodule detection platform designed specifically for radiology departments like yours at ${params.hospitalName}.

Our system analyzes CT scans to detect lung nodules with sensitivity ≥95% and specificity ≥90%, providing Lung-RADS standardized assessment and auto-generated reports.

Key benefits:
- Reduce radiologist reading time by up to 40%
- Standardized Lung-RADS scoring for consistent reporting
- HIPAA-compliant cloud infrastructure
- Seamless integration with existing PACS systems

Request a demo: ${params.ctaUrl}

I would be happy to schedule a 20-minute call to discuss how LungAI can support ${params.hospitalName}'s radiology team.

Best regards,
LungAI Team

---
LungAI — AI Medical Imaging SaaS Platform
To unsubscribe, reply with "unsubscribe."`;
  }
}

export const emailService = new EmailService();
