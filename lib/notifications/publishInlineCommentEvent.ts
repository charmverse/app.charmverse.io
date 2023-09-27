import type { PageType } from '@charmverse/core/prisma-client';

import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishDocumentEvent } from 'lib/webhookPublisher/publishEvent';

export async function publishInlineCommentEvent({
  inlineCommentId,
  page,
  userId
}: {
  page: {
    id: string;
    cardId: string | null;
    proposalId: string | null;
    bountyId: string | null;
    createdBy: string;
    spaceId: string;
    type: PageType;
  };
  inlineCommentId: string;
  userId: string;
}) {
  await publishDocumentEvent({
    documentId: page.id,
    scope: WebhookEventNames.DocumentInlineCommentCreated,
    inlineCommentId,
    spaceId: page.spaceId,
    userId
  });
}
