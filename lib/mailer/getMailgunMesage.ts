import * as http from 'adapters/http';

import { API_KEY, DOMAIN } from './mailgunClient';

interface EmailMessage {
  subject: string;
  sender: string;
  'stripped-html': string;
  'X-Mailgun-Tag': string;
  recipients: string;
  'Mime-Version': string;
  from: string;
  'Body-Plain': string;
  Subject: string;
  To: string;
  content_type: string;
  From: string;
  content_transfer_encoding: string;
  'Message-Id': string;
  'Message-Headers': [string, string][];
  'stripped-text': string;
  'Body-HTML': string;
}

async function getMailgunMessage({ domainName, messageId }: { messageId: string; domainName: string }) {
  const emailMessage = await http.GET<EmailMessage>(
    `https://api.mailgun.net/v3/domains/updates.${DOMAIN}/messages/${messageId}`,
    {},
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${API_KEY}`).toString('base64')}`
      }
    }
  );

  return emailMessage;
}
