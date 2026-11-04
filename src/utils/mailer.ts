import nodemailer from "nodemailer";
import { isProduction } from "../config";

// Until SMTP_HOST is configured, OTP codes are printed to the server console
// instead of being emailed, and (outside production) returned in the API
// response so the flow can be tested. Switching mailbox (test Gmail ->
// production) only needs the SMTP_* values in .env changed.
export const isMailConfigured = Boolean(process.env.SMTP_HOST);

// Outside production with no mail server, callers may expose the code to the
// client; in production a missing mail server is an error instead
export const exposeDevOtp = !isMailConfigured && !isProduction;

const smtpPort = Number(process.env.SMTP_PORT || 465);

// 465 is TLS from the start; 587 upgrades with STARTTLS
const transporter = isMailConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      // On 587, refuse to send if the server doesn't offer STARTTLS
      requireTLS: smtpPort !== 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

export async function sendOtpMail(
  to: string,
  code: string,
  minutes: number,
  jobTitle: string,
) {
  if (!transporter) {
    console.log(`[mail] OTP for ${to}: ${code} (valid ${minutes} min)`);
    return;
  }

  // The code in the subject and a plain "verification code is X" sentence let
  // Gmail and phones detect it and offer their own "Copy code" button
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: `${code} is your Snowtex verification code`,
    text: `Your Snowtex verification code is ${code}\n\nEnter it on the application page to continue applying for ${jobTitle}. It expires in ${minutes} minutes.\n\nDon't share this code with anyone. If you did not request it, you can ignore this email.`,
    html: otpMailHtml(code, minutes, jobTitle),
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Email clients strip <style> and scripts, so everything is inline and laid out
// with tables. The code is one unbroken text node: a double-click selects all
// of it, and Gmail/phones can recognise it as a code. Colours follow the
// website's primary palette.
function otpMailHtml(code: string, minutes: number, jobTitle: string) {
  const title = escapeHtml(jobTitle);

  // No "Copy code" button: emails can't run scripts, so a button could only be
  // a link that opens a page. Copying is left to the mail app's own detection
  // (Gmail/phones) and to double-click / long-press on the code.
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">Your verification code is ${code}. It expires in ${minutes} minutes.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;font-family:'Segoe UI',Roboto,Arial,Helvetica,sans-serif">
  <tr><td align="center" style="padding:40px 16px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
      <tr><td style="padding:0 4px 16px;font-size:18px;font-weight:700;letter-spacing:3px;color:#1f5da0">SNOWTEX <span style="font-weight:400;letter-spacing:1px;color:#5f6368">CAREERS</span></td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e3e8ef;border-top:4px solid #1f5da0;border-radius:16px">
      <tr><td style="padding:36px 32px 32px">
        <p style="margin:0 0 8px;font-size:22px;line-height:28px;font-weight:700;color:#1a1d21">Verify your email</p>
        <p style="margin:0 0 28px;font-size:15px;line-height:22px;color:#4a5361">Enter this code on the application page to continue applying for <strong style="color:#1a1d21">${title}</strong>.</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e9eff6;border:1px dashed #a9c0db;border-radius:12px">
          <tr><td align="center" style="padding:22px 16px 24px">
            <p style="margin:0 0 10px;font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#4a5361">Your verification code is</p>
            <p style="margin:0;padding-left:10px;font-family:Consolas,'Courier New',Courier,monospace;font-size:36px;line-height:44px;font-weight:700;letter-spacing:10px;color:#104278">${code}</p>
          </td></tr>
        </table>
        <p style="margin:12px 0 0;font-size:12px;line-height:18px;text-align:center;color:#80868b">Double-click or long-press the code to copy it.</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px">
          <tr><td style="padding:14px 16px;background:#fff8e6;border-radius:10px;font-size:14px;line-height:20px;color:#5c4400">
            This code expires in <strong>${minutes} minutes</strong> and can be used once. Never share it with anyone, including Snowtex staff.
          </td></tr>
        </table>

        <p style="margin:24px 0 0;font-size:13px;line-height:20px;color:#80868b">If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.</p>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
      <tr><td align="center" style="padding:20px 16px 0;font-size:12px;line-height:18px;color:#9aa0a6">This is an automated message from Snowtex Group. Please don't reply to this email.</td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
