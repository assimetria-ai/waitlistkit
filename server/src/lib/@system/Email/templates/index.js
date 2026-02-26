// @system — Email templates
// Each function returns an HTML string ready to pass to Email.send().
// Shared layout is handled by _layout(); individual templates set their content.

'use strict'

const APP_NAME = () => process.env.APP_NAME ?? 'App'
const BRAND_COLOR = '#111827' // matches design system – override via env if needed

// ── Shared layout ─────────────────────────────────────────────────────────────

/**
 * Wrap content in a consistent email shell.
 * @param {object} opts
 * @param {string} opts.content   Inner HTML content block
 * @param {string} [opts.preview] Optional preview text (shown in email clients)
 */
function _layout({ content, preview = '' }) {
  const appName = APP_NAME()
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${appName}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  ${preview ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${preview}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;padding:48px 16px 48px 16px">
    <tr>
      <td align="center">
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin-bottom:24px">
          <tr>
            <td align="center">
              <span style="font-size:18px;font-weight:700;color:${BRAND_COLOR};letter-spacing:-0.3px">${appName}</span>
            </td>
          </tr>
        </table>
        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
          <tr>
            <td style="padding:40px 40px 32px 40px">
              ${content}
            </td>
          </tr>
        </table>
        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin-top:24px">
          <tr>
            <td align="center">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6">
                &copy; ${year} ${appName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Button component ──────────────────────────────────────────────────────────

function _button(label, url, bg = BRAND_COLOR) {
  return `<a href="${url}"
    style="display:inline-block;padding:12px 24px;background:${bg};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;letter-spacing:-0.1px;line-height:1"
    target="_blank">${label}</a>`
}

// ── Divider ───────────────────────────────────────────────────────────────────

function _divider() {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0">
    <tr><td style="border-top:1px solid #f3f4f6;height:1px;font-size:0;line-height:0">&nbsp;</td></tr>
  </table>`
}

// ── Copy link helper ──────────────────────────────────────────────────────────

function _copyLink(url) {
  return `<p style="margin:20px 0 0;font-size:13px;color:#9ca3af;line-height:1.5">
    Or copy this link:<br>
    <a href="${url}" style="color:#6b7280;word-break:break-all">${url}</a>
  </p>`
}

// ── Templates ─────────────────────────────────────────────────────────────────

/**
 * Email-verification template.
 * @param {{ name?: string, verifyUrl: string }} opts
 */
function verification({ name, verifyUrl }) {
  const displayName = name ?? 'there'
  return _layout({
    preview: 'Verify your email address to activate your account.',
    content: `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;line-height:1.3">
        Verify your email address
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6">
        Hi ${_escape(displayName)}, thanks for signing up. Click the button below to confirm your email and activate your account.
      </p>
      ${_button('Verify email', verifyUrl)}
      <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;line-height:1.5">
        This link expires in <strong>24 hours</strong>. If you didn't create an account you can safely ignore this email.
      </p>
      ${_copyLink(verifyUrl)}`,
  })
}

/**
 * Password-reset template.
 * @param {{ name?: string, resetUrl: string }} opts
 */
function passwordReset({ name, resetUrl }) {
  const displayName = name ?? 'there'
  return _layout({
    preview: 'Reset your password — this link expires in 1 hour.',
    content: `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;line-height:1.3">
        Reset your password
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6">
        Hi ${_escape(displayName)}, we received a request to reset the password for your account.
        Click the button below to choose a new password.
      </p>
      ${_button('Reset password', resetUrl)}
      <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;line-height:1.5">
        This link expires in <strong>1 hour</strong>. If you didn't request a password reset, no action is required.
      </p>
      ${_copyLink(resetUrl)}`,
  })
}

/**
 * Welcome email sent after registration is complete.
 * @param {{ name?: string, appUrl: string, appName: string }} opts
 */
function welcome({ name, appUrl, appName }) {
  const displayName = name ?? 'there'
  const label = appName ?? APP_NAME()
  return _layout({
    preview: `Welcome to ${label} — let's get you started.`,
    content: `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;line-height:1.3">
        Welcome to ${_escape(label)}&nbsp;🎉
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.6">
        Hi ${_escape(displayName)}, your account is all set. Here's what you can do next:
      </p>
      <ul style="margin:0 0 28px;padding-left:20px;font-size:15px;color:#374151;line-height:1.8">
        <li>Complete your profile</li>
        <li>Explore the dashboard</li>
        <li>Invite your team</li>
      </ul>
      ${_button('Go to dashboard', appUrl)}
      <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;line-height:1.5">
        Questions? Reply to this email and we'll be happy to help.
      </p>`,
  })
}

/**
 * Workspace / team invitation.
 * @param {{ inviterName: string, orgName: string, inviteUrl: string }} opts
 */
function invitation({ inviterName, orgName, inviteUrl }) {
  const label = APP_NAME()
  return _layout({
    preview: `${inviterName} invited you to join ${orgName} on ${label}.`,
    content: `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;line-height:1.3">
        You've been invited
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6">
        <strong>${_escape(inviterName)}</strong> has invited you to join
        <strong>${_escape(orgName)}</strong> on ${_escape(label)}.
        Click the button below to accept the invitation.
      </p>
      ${_button('Accept invitation', inviteUrl)}
      <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;line-height:1.5">
        This invitation expires in <strong>7 days</strong>. If you weren't expecting this, you can ignore this email.
      </p>
      ${_copyLink(inviteUrl)}`,
  })
}

/**
 * Magic-link (passwordless) sign-in email.
 * @param {{ name?: string, magicUrl: string }} opts
 */
function magicLink({ name, magicUrl }) {
  const displayName = name ?? 'there'
  return _layout({
    preview: 'Your sign-in link — valid for 15 minutes.',
    content: `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;line-height:1.3">
        Sign in to ${_escape(APP_NAME())}
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6">
        Hi ${_escape(displayName)}, click the button below to sign in. No password needed.
      </p>
      ${_button('Sign in', magicUrl)}
      <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;line-height:1.5">
        This link expires in <strong>15 minutes</strong> and can only be used once.
        If you didn't request this, you can safely ignore this email.
      </p>
      ${_copyLink(magicUrl)}`,
  })
}

/**
 * Generic notification with optional CTA.
 * @param {{ title: string, body: string, ctaLabel?: string, ctaUrl?: string }} opts
 */
function notification({ title, body, ctaLabel, ctaUrl }) {
  const cta = ctaLabel && ctaUrl
    ? `<div style="margin-top:28px">${_button(ctaLabel, ctaUrl)}</div>`
    : ''
  return _layout({
    preview: title,
    content: `
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;line-height:1.3">
        ${_escape(title)}
      </h1>
      <div style="font-size:15px;color:#6b7280;line-height:1.7">
        ${body}
      </div>
      ${cta}`,
  })
}

// ── Safety ────────────────────────────────────────────────────────────────────

/**
 * Escape special HTML characters to prevent XSS in dynamic template values.
 */
function _escape(str) {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

module.exports = {
  verification,
  passwordReset,
  welcome,
  invitation,
  magicLink,
  notification,
  // Expose layout + helpers for @custom templates
  _layout,
  _button,
  _divider,
  _escape,
}
