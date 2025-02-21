import { isTruthy } from '@packages/lib/utils/types';
import type { WebhookPayload } from '@root/lib/webhookPublisher/interfaces';

import { createCardNotifications } from './cards/createCardNotifications';
import { createDocumentNotifications } from './documents/createDocumentNotifications';
import { createForumNotifications } from './forum/createForumNotifications';
import type { NotificationEmailInput } from './mailer/sendNotificationEmail';
import { getNotificationToggles, isNotificationEnabled } from './notificationToggles';
import { createPollNotifications } from './polls/createPollNotifications';
import { createProposalNotifications } from './proposals/createProposalNotifications';
import { createRewardNotifications } from './rewards/createRewardNotifications';

export async function createNotificationsFromEvent(
  webhookData: Pick<WebhookPayload, 'createdAt' | 'spaceId' | 'event'>
): Promise<NotificationEmailInput[]> {
  const notificationToggles = await getNotificationToggles({ spaceId: webhookData.spaceId });
  return Promise.all([
    isNotificationEnabled({ group: 'proposals', rules: notificationToggles })
      ? createProposalNotifications(webhookData).then((ids) => ids.map((id) => ({ id, type: 'proposals' as const })))
      : [],
    isNotificationEnabled({ group: 'polls', rules: notificationToggles })
      ? createPollNotifications(webhookData).then((ids) => ids.map((id) => ({ id, type: 'polls' as const })))
      : [],
    isNotificationEnabled({ group: 'rewards', rules: notificationToggles })
      ? createRewardNotifications(webhookData).then((ids) => ids.map((id) => ({ id, type: 'rewards' as const })))
      : [],
    createDocumentNotifications(webhookData).then((ids) => ids.map((id) => ({ id, type: 'documents' as const }))),
    isNotificationEnabled({ group: 'forum', rules: notificationToggles })
      ? createForumNotifications(webhookData).then((ids) => ids.map((id) => ({ id, type: 'forum' as const })))
      : [],
    createCardNotifications(webhookData).then((ids) => ids.map((id) => ({ id, type: 'card' as const })))
  ]).then((results) => {
    return results.flat().filter(isTruthy);
  });
}
