/**
 * Tall Order branded email template wrapper.
 * Use this for all transactional emails sent via send.ts (notifications, etc.)
 *
 * Usage:
 *   import { wrapEmail } from './templates/base'
 *   const html = wrapEmail({
 *     title: 'New Match Notification',
 *     body: '<p>Someone new wants to connect with you...</p>',
 *     ctaText: 'View Profile',
 *     ctaUrl: 'https://www.tallorder.date/matches',
 *   })
 */

interface EmailTemplateOptions {
  title: string
  body: string
  ctaText?: string
  ctaUrl?: string
  footerNote?: string
}

export function wrapEmail(options: EmailTemplateOptions): string {
  const { title, body, ctaText, ctaUrl, footerNote } = options

  const ctaBlock = ctaText && ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
        <tr>
          <td style="background-color:#1C1917;border-radius:8px;">
            <a href="${ctaUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">${ctaText}</a>
          </td>
        </tr>
      </table>`
    : ''

  const footerNoteBlock = footerNote
    ? `<p style="margin:0 0 8px;color:#A8A29E;font-size:12px;">${footerNote}</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#FAFAF9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF9;padding:40px 20px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

<!-- Header -->
<tr>
<td style="background-color:#1C1917;padding:32px 40px;text-align:center;">
<img src="https://oxkuoheyknmnbfactggz.supabase.co/storage/v1/object/public/brand/logo-dark-cropped.png" alt="Tall Order" width="48" height="48" style="display:inline-block;vertical-align:middle;border-radius:8px;">
<span style="display:inline-block;vertical-align:middle;margin-left:12px;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Tall Order</span>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:40px;">
<h1 style="margin:0 0 16px;color:#1C1917;font-size:24px;font-weight:700;line-height:1.3;">${title}</h1>
<div style="color:#78716C;font-size:16px;line-height:1.6;">${body}</div>
${ctaBlock}
</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding:24px 40px;border-top:1px solid #E7E5E4;text-align:center;">
${footerNoteBlock}
<p style="margin:0 0 4px;color:#A8A29E;font-size:12px;">Tall Order by WasatchWise LLC</p>
<p style="margin:0;color:#A8A29E;font-size:12px;">Dating for Tall People</p>
<p style="margin:8px 0 0;"><a href="https://www.tallorder.date" style="color:#D97706;font-size:12px;text-decoration:none;">tallorder.date</a></p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`
}
