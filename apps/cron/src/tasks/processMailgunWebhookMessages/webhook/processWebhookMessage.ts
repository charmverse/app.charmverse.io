import { createHmac } from 'crypto';

import { prisma } from '@charmverse/core/prisma-client';
import { SIGNING_KEY } from '@root/lib/mailer/mailgunClient';
import { createPageComment } from '@root/lib/pages/comments/createPageComment';
import { createDocumentWithText } from '@root/lib/prosemirror/constants';
import { WebhookEventNames } from '@root/lib/webhookPublisher/interfaces';
import { publishDocumentEvent } from '@root/lib/webhookPublisher/publishEvent';

import type { WebhookMessageProcessResult } from '../../processCollablandWebhookMessages/webhook/interfaces';

type WebhookPayload = {
  body: string;
};

type MailgunWebhookPayload = {
  'Content-Type': string;
  Date: string;
  'Dkim-Signature': string;
  From: string;
  'In-Reply-To': string;
  'Message-Id': string;
  'Mime-Version': string;
  Received: string;
  References: string;
  Subject: string;
  To: string;
  'X-Envelope-From': string;
  'X-Gm-Message-State': string;
  'X-Google-Dkim-Signature': string;
  'X-Google-Smtp-Source': string;
  'X-Mailgun-Incoming': string;
  'X-Received': string;
  'body-html': string;
  'body-plain': string;
  domain: string;
  from: string;
  'message-url': string;
  recipient: string;
  sender: string;
  signature: string;
  'stripped-html': string;
  'stripped-text': string;
  subject: string;
  timestamp: string;
  token: string;
};

// Function to verify the Mailgun webhook payload
function verifyMailgunWebhook(payload: MailgunWebhookPayload): boolean {
  const { timestamp, token, signature } = payload;
  const data = timestamp + token;
  const generatedSignature = createHmac('sha256', SIGNING_KEY as string)
    .update(data)
    .digest('hex');
  return generatedSignature === signature;
}

export async function processWebhookMessage(message: WebhookPayload): Promise<WebhookMessageProcessResult> {
  const data = message?.body;
  const params = new URLSearchParams(data);
  const decodedData = {} as MailgunWebhookPayload;

  params.forEach((value, key) => {
    decodedData[key as keyof MailgunWebhookPayload] = value;
  });

  const hasPermission = verifyMailgunWebhook(decodedData);
  if (!hasPermission) {
    return {
      success: true,
      message: 'Webhook message without permission to be parsed.'
    };
  }

  const referencedMessageIds = decodedData.References.split(' ').map((ref) => ref.trim());

  const notification = await prisma.userNotificationMetadata.findFirst({
    where: {
      messageId: referencedMessageIds[0] || decodedData['In-Reply-To'],
      documentNotifications: {
        some: {
          type: {
            in: ['comment.created', 'comment.replied']
          }
        }
      }
    },
    select: {
      userId: true,
      spaceId: true,
      documentNotifications: {
        select: {
          pageId: true,
          pageCommentId: true
        }
      }
    }
  });

  if (!notification) {
    return {
      success: true,
      message: 'Notification not found.'
    };
  }

  const pageId = notification.documentNotifications[0].pageId;
  const pageCommentId = notification.documentNotifications[0].pageCommentId;
  const spaceId = notification.spaceId;

  if (!pageId || !pageCommentId) {
    return {
      success: true,
      message: 'Page or comment not found.'
    };
  }

  const text = decodedData['stripped-text'];

  const pageComment = await createPageComment({
    content: createDocumentWithText(text),
    contentText: text,
    pageId,
    userId: notification.userId,
    parentId: pageCommentId
  });

  await publishDocumentEvent({
    documentId: pageId,
    scope: WebhookEventNames.DocumentCommentCreated,
    commentId: pageComment.id,
    spaceId
  });

  return {
    success: true,
    message: 'Comment created successfully.'
  };
}
