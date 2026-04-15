import nodemailer from 'nodemailer'

export interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const gmailUser = process.env.GMAIL_USER
  const gmailPassword = process.env.GMAIL_APP_PASSWORD

  if (!gmailUser || !gmailPassword) {
    console.warn('sendEmail: GMAIL_USER / GMAIL_APP_PASSWORD not configured, skipping')
    return
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: gmailUser, pass: gmailPassword },
  })

  await transporter.sendMail({
    from: `Tall Order <${gmailUser}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  })
}

export function notifyConnectionRequest(recipientEmail: string, recipientPseudonym: string) {
  return sendEmail({
    to: recipientEmail,
    subject: 'Someone wants to connect with you on Tall Order',
    html: `
      <p>Hey ${recipientPseudonym},</p>
      <p>Someone on Tall Order sent you a connection request.</p>
      <p><a href="https://tallorder.date/connections">Sign in to respond</a></p>
      <p style="color:#999;font-size:12px">You received this because you have a Tall Order account.</p>
    `,
  }).catch(() => {})
}

export function notifyConnectionAccepted(recipientEmail: string, recipientPseudonym: string) {
  return sendEmail({
    to: recipientEmail,
    subject: 'Your connection request was accepted',
    html: `
      <p>Hey ${recipientPseudonym},</p>
      <p>Your connection request was accepted. Head back to Tall Order to start the conversation.</p>
      <p><a href="https://tallorder.date/connections">Go to your connections</a></p>
      <p style="color:#999;font-size:12px">You received this because you have a Tall Order account.</p>
    `,
  }).catch(() => {})
}

export function notifyConnectionDeclined(recipientEmail: string, recipientPseudonym: string) {
  return sendEmail({
    to: recipientEmail,
    subject: 'Connection request update on Tall Order',
    html: `
      <p>Hey ${recipientPseudonym},</p>
      <p>Your recent connection request wasn't accepted this time. Keep browsing -- there are plenty of great people on Tall Order.</p>
      <p><a href="https://tallorder.date/browse">Browse profiles</a></p>
      <p style="color:#999;font-size:12px">You received this because you have a Tall Order account.</p>
    `,
  }).catch(() => {})
}

export function notifyDisconnection(recipientEmail: string, recipientPseudonym: string) {
  return sendEmail({
    to: recipientEmail,
    subject: 'A connection was removed on Tall Order',
    html: `
      <p>Hey ${recipientPseudonym},</p>
      <p>One of your connections has been removed. This can happen when someone decides to move on.</p>
      <p><a href="https://tallorder.date/connections">View your connections</a></p>
      <p style="color:#999;font-size:12px">You received this because you have a Tall Order account.</p>
    `,
  }).catch(() => {})
}

export function notifyNewMessage(recipientEmail: string, recipientPseudonym: string, senderPseudonym: string) {
  return sendEmail({
    to: recipientEmail,
    subject: `New message from ${senderPseudonym} on Tall Order`,
    html: `
      <p>Hey ${recipientPseudonym},</p>
      <p>${senderPseudonym} sent you a message on Tall Order.</p>
      <p><a href="https://tallorder.date/messages">Sign in to read it</a></p>
      <p style="color:#999;font-size:12px">You received this because you have a Tall Order account.</p>
    `,
  }).catch(() => {})
}

export function notifyRevealRequest(recipientEmail: string, recipientPseudonym: string) {
  return sendEmail({
    to: recipientEmail,
    subject: 'Someone wants to see your photos on Tall Order',
    html: `
      <p>Hey ${recipientPseudonym},</p>
      <p>Someone on Tall Order requested a photo reveal. You have 72 hours to respond.</p>
      <p><a href="https://tallorder.date/connections">Sign in to respond</a></p>
      <p style="color:#999;font-size:12px">You received this because you have a Tall Order account.</p>
    `,
  }).catch(() => {})
}
