import { log } from '@charmverse/core/log';
import { htmlToText } from 'html-to-text';
import type { IMailgunClient } from 'mailgun.js/Interfaces';

import { getPlainEmail } from './emails/emails';
import mailgunClient, { DOMAIN, SENDER_ADDRESS } from './mailgunClient';

export interface EmailRecipient {
  email: string;
  displayName?: string | null;
  userId?: string;
}

type EmailProps = {
  subject: string;
  to: EmailRecipient;
  attachment?: { data: Buffer; name: string };
  senderAddress?: string;
  client?: IMailgunClient | null;
};

export async function sendEmail({
  client,
  html,
  subject,
  to,
  attachment,
  senderAddress
}: EmailProps & { html: string }) {
  const recipientAddress = to.displayName ? `${to.displayName} <${to.email}>` : to.email;
  client = client ?? mailgunClient;

  if (!client) {
    log.debug('No mailgun client, not sending email');
  } else {
    log.debug('Sending email to Mailgun', { subject, userId: to.userId });
  }

  return client?.messages.create(DOMAIN, {
    from: senderAddress ?? SENDER_ADDRESS,
    to: [recipientAddress],
    subject,
    text: htmlToText(html),
    html,
    attachment: attachment ? { data: attachment.data, filename: attachment.name } : undefined
  });
}

export async function sendPlainEmail({
  client,
  html,
  subject,
  to,
  attachment,
  senderAddress
}: EmailProps & { text: string | string[] }) {
  const template = await getPlainEmail({ html, subject });
  return sendEmail({ client, template, subject, to, senderAddress });
}
export async function sendTemplateEmail({
  client,
  template,
  subject,
  to,
  senderAddress,
  templateVars
}: EmailProps & { template: string; templateVars?: Record<string, string> }) {
  const recipientAddress = to.displayName ? `${to.displayName} <${to.email}>` : to.email;
  client = client ?? mailgunClient;

  if (!client) {
    log.debug('No mailgun client, not sending email');
  } else {
    log.debug('Sending email to Mailgun', { subject, userId: to.userId });
  }

  return client?.messages.create(DOMAIN, {
    from: senderAddress ?? SENDER_ADDRESS,
    to: [recipientAddress],
    subject,
    template,
    't:variables': templateVars
  });
}
