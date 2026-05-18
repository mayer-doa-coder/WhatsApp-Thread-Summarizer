'use strict';

const nodemailer = require('nodemailer');

// Keep a singleton only for the Ethereal dev fallback (avoids creating a new fake account per
// request). For real SMTP we create a fresh transporter on every call so stale/timed-out
// connections are never reused — the most reliable approach for low-volume transactional mail.
let _etherealTransporter = null;

async function getTransporter() {
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST.trim(),
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      // Force STARTTLS upgrade on port 587 (plain → TLS). Required by Gmail.
      requireTLS: process.env.EMAIL_SECURE !== 'true',
      auth: {
        user: (process.env.EMAIL_USER ?? '').trim(),
        pass: (process.env.EMAIL_PASS ?? '').trim(),
      },
    });
  }

  // Development fallback: Ethereal fake SMTP — preview URL is logged to console
  if (!_etherealTransporter) {
    const testAccount = await nodemailer.createTestAccount();
    _etherealTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log(`[email] No EMAIL_HOST set — using Ethereal test account: ${testAccount.user}`);
  }

  return _etherealTransporter;
}

async function sendOTPEmail(toEmail, otp) {
  const transport = await getTransporter();

  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM || '"Thread Summarizer" <noreply@threadsummarizer.app>',
    to: toEmail,
    subject: 'Your verification code',
    text: `Your Thread Summarizer verification code is: ${otp}\n\nThis code expires in 15 minutes. Do not share it with anyone.`,
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px;">
        <h2 style="margin-bottom:8px;color:#111">Verify your email</h2>
        <p style="color:#555;margin-bottom:24px;">Enter the code below to complete your Thread Summarizer registration.</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:10px;text-align:center;padding:20px 0;background:#f4f4f4;border-radius:10px;">
          ${otp}
        </div>
        <p style="color:#888;font-size:13px;margin-top:20px;">This code expires in <strong>15 minutes</strong>. If you did not create an account, you can safely ignore this email.</p>
      </div>
    `,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) console.log(`[email] Preview URL (Ethereal): ${previewUrl}`);
}

async function sendPasswordResetEmail(toEmail, token) {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  const transport = await getTransporter();

  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM || '"Thread Summarizer" <noreply@threadsummarizer.app>',
    to: toEmail,
    subject: 'Reset your password',
    text: `You requested a password reset for your Thread Summarizer account.\n\nClick the link below to choose a new password:\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, you can safely ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px;">
        <h2 style="margin-bottom:8px;color:#111">Reset your password</h2>
        <p style="color:#555;margin-bottom:24px;">We received a request to reset the password for your Thread Summarizer account. Click the button below to choose a new password.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${resetUrl}"
             style="display:inline-block;background:#25D366;color:#111;font-weight:700;font-size:15px;
                    padding:14px 32px;border-radius:8px;text-decoration:none;">
            Reset password
          </a>
        </div>
        <p style="color:#888;font-size:13px;">Or copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color:#25D366;word-break:break-all;">${resetUrl}</a>
        </p>
        <p style="color:#888;font-size:13px;margin-top:20px;">This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will not change.</p>
      </div>
    `,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) console.log(`[email] Preview URL (Ethereal): ${previewUrl}`);
}

module.exports = { sendOTPEmail, sendPasswordResetEmail };
