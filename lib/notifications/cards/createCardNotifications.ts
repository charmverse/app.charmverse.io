import type { WebhookEvent } from 'lib/webhookPublisher/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import { createCardNotification } from '../saveNotification';

export async function createCardNotifications(webhookData: {
  createdAt: string;
  event: WebhookEvent;
  spaceId: string;
}) {
  switch (webhookData.event.scope) {
    case WebhookEventNames.CardPersonPropertyAssigned: {
      const spaceId = webhookData.spaceId;
      const assignedUserId = webhookData.event.assignedUser.id;
      const cardId = webhookData.event.card.id;

      if (webhookData.event.user.id !== assignedUserId) {
        await createCardNotification({
          type: 'person_assigned',
          personPropertyId: webhookData.event.personProperty.id,
          cardId,
          spaceId,
          userId: assignedUserId,
          createdBy: webhookData.event.user.id
        });
      }
      break;
    }

    default:
      break;
  }
}
