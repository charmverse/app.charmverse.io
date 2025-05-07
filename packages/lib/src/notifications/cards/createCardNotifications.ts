import type { WebhookEvent } from '@packages/lib/webhookPublisher/interfaces';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';

import { saveCardNotification } from '../saveNotification';

export async function createCardNotifications(webhookData: {
  createdAt: string;
  event: WebhookEvent;
  spaceId: string;
}): Promise<string[]> {
  const ids: string[] = [];
  switch (webhookData.event.scope) {
    case WebhookEventNames.CardPersonPropertyAssigned: {
      const spaceId = webhookData.spaceId;
      const assignedUserId = webhookData.event.assignedUser.id;
      const cardId = webhookData.event.card.id;

      if (webhookData.event.user.id !== assignedUserId) {
        const { id } = await saveCardNotification({
          type: 'person_assigned',
          personPropertyId: webhookData.event.personProperty.id,
          cardId,
          spaceId,
          userId: assignedUserId,
          createdAt: webhookData.createdAt,
          createdBy: webhookData.event.user.id
        });
        ids.push(id);
      }
      break;
    }

    default:
      break;
  }
  return ids;
}
