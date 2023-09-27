import type { Page, PageType } from '@charmverse/core/prisma-client';

import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishCardEvent, publishDocumentEvent } from 'lib/webhookPublisher/publishEvent';

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
  if (page.type === 'card' && page.cardId) {
    await publishCardEvent({
      cardId: page.cardId,
      scope: WebhookEventNames.CardInlineCommentCreated,
      inlineCommentId,
      spaceId: page.spaceId,
      userId
    });
  } else {
    await publishDocumentEvent({
      documentId: page.id,
      scope: WebhookEventNames.DocumentInlineCommentCreated,
      inlineCommentId,
      spaceId: page.spaceId,
      userId
    });
  }
}
