import { log } from '@charmverse/core/log';
import { htmlToText } from 'html-to-text';

import { getPageInviteEmail } from './emails';
import type { PageInviteEmailProps } from './emails/templates/PageInviteTemplate';
import client, { DOMAIN, SENDER_ADDRESS } from './mailgunClient';

export interface EmailRecipient {
  email: string;
  displayName?: string | null;
  userId: string;
}

interface EmailProps {
  html: string;
  subject: string;
  to: EmailRecipient;
  attachment?: { data: Buffer; name: string };
  senderAddress?: string;
}

export async function sendEmail({ html, subject, to, attachment }: EmailProps) {
  const recipientAddress = to.displayName ? `${to.displayName} <${to.email}>` : to.email;

  if (!client) {
    log.debug('No mailgun client, not sending email');
  } else {
    log.debug('Sending email to Mailgun', { subject, userId: to.userId });
  }

  return client?.messages.create(DOMAIN, {
    from: SENDER_ADDRESS,
    to: [recipientAddress],
    subject,
    text: htmlToText(html),
    html,
    attachment: attachment ? { data: attachment.data, filename: attachment.name } : undefined
  });
}

export function sendPageInviteEmail({ to, ...variables }: { to: EmailRecipient } & PageInviteEmailProps) {
  const template = getPageInviteEmail(variables);
  return sendEmail({ ...template, to });
}
