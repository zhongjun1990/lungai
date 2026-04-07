// Email Routes
import { Router, Request, Response } from 'express';
import { emailService } from '../services/email';
import { success, error, badRequest, serverError } from '../utils/response';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// POST /v1/email/send — Send a plain text/HTML email
router.post('/send', optionalAuth, async (req: Request, res: Response) => {
  const { to, subject, text, html, from, replyTo, attachments } = req.body;

  if (!to || !subject) {
    return badRequest(res, 'Missing required fields: to, subject');
  }

  const result = await emailService.send({
    to,
    subject,
    text,
    html,
    from,
    replyTo,
    attachments,
  });

  if (!result.success) {
    return serverError(res, `Failed to send email: ${result.error}`);
  }

  return success(res, { messageId: result.messageId }, 'Email sent successfully');
});

// POST /v1/email/outreach — Send a cold outreach email (B2B)
router.post('/outreach', optionalAuth, async (req: Request, res: Response) => {
  const { to, recipientName, hospitalName, ctaUrl } = req.body;

  if (!to || !recipientName || !hospitalName) {
    return badRequest(res, 'Missing required fields: to, recipientName, hospitalName');
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return badRequest(res, 'Invalid email address format');
  }

  const result = await emailService.sendColdOutreach({ to, recipientName, hospitalName, ctaUrl });

  if (!result.success) {
    return serverError(res, `Failed to send outreach email: ${result.error}`);
  }

  return success(res, { messageId: result.messageId }, 'Outreach email sent successfully');
});

// POST /v1/email/outreach/batch — Send batch cold outreach (for CMP-58)
router.post('/outreach/batch', optionalAuth, async (req: Request, res: Response) => {
  const { recipients } = req.body as {
    recipients: { to: string; recipientName: string; hospitalName: string; ctaUrl?: string }[];
  };

  if (!recipients || !Array.isArray(recipients)) {
    return badRequest(res, 'Missing or invalid field: recipients (array expected)');
  }

  if (recipients.length > 100) {
    return badRequest(res, 'Maximum 100 recipients per batch');
  }

  const results = await Promise.all(
    recipients.map(async (r) => {
      const result = await emailService.sendColdOutreach(r);
      return { to: r.to, ...result };
    })
  );

  const sent = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return success(res, {
    total: results.length,
    sent,
    failed,
    results,
  }, `Batch outreach: ${sent} sent, ${failed} failed`);
});

// POST /v1/email/test — Send a test email (for verification)
router.post('/test', optionalAuth, async (req: Request, res: Response) => {
  const { to } = req.body;

  if (!to) {
    return badRequest(res, 'Missing required field: to');
  }

  const result = await emailService.send({
    to,
    subject: 'LungAI — Test Email',
    text: 'This is a test email from the LungAI platform. If you received this, the SendGrid email pipeline is working correctly.',
    html: '<p>This is a <strong>test email</strong> from the <strong>LungAI</strong> platform. If you received this, the SendGrid email pipeline is working correctly.</p>',
  });

  if (!result.success) {
    return serverError(res, `Test email failed: ${result.error}`);
  }

  return success(res, { messageId: result.messageId }, 'Test email sent successfully');
});

// GET /v1/email/status — Check email service status
router.get('/status', (_req: Request, res: Response) => {
  return success(res, {
    configured: !!req.app.get('sendgridConfigured'),
    provider: 'SendGrid',
  }, 'Email service status');
});

export { router as emailRouter };
