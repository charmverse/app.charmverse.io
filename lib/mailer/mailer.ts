import { htmlToText } from 'html-to-text';

import log from 'lib/log';

import client, { SENDER_ADDRESS, DOMAIN } from './mailgunClient';

export interface EmailRecipient {
  email: string;
  displayName?: string | null;
}

interface EmailProps {
  html: string;
  subject: string;
  to: EmailRecipient;
  attachment?: { data: Buffer, name: string };
}

export async function sendEmail ({ html, subject, to, attachment }: EmailProps) {
  const recipientAddress = to.displayName
    ? `${to.displayName} <${to.email}>`
    : to.email;

  if (!client) {
    log.debug('No mailgun client, not sending email');
  }

  return client?.messages.create(DOMAIN, {
    from: SENDER_ADDRESS,
    to: [recipientAddress],
    // bcc: ['matt.casey@charmverse.io'],
    subject,
    text: htmlToText(html),
    html,
    attachment: attachment ? { data: attachment.data, filename: attachment.name } : undefined
  });
}
