import { isTruthy } from 'lib/utilities/types';
import type { WebhookPayload } from 'lib/webhookPublisher/interfaces';

import { createCardNotifications } from './cards/createCardNotifications';
import { createDocumentNotifications } from './documents/createDocumentNotifications';
import { createForumNotifications } from './forum/createForumNotifications';
import { getNotificationToggles, isNotificationEnabled } from './notificationToggles';
import { createPollNotifications } from './polls/createPollNotifications';
import { createProposalNotifications } from './proposals/createProposalNotifications';
import { createRewardNotifications } from './rewards/createRewardNotifications';

export async function createNotificationsFromEvent(
  webhookData: Pick<WebhookPayload, 'createdAt' | 'spaceId' | 'event'>
) {
  const notificationToggles = await getNotificationToggles({ spaceId: webhookData.spaceId });
  return Promise.all([
    isNotificationEnabled({ group: 'proposals', rules: notificationToggles }) &&
      createProposalNotifications(webhookData),
    isNotificationEnabled({ group: 'polls', rules: notificationToggles }) && createPollNotifications(webhookData),
    isNotificationEnabled({ group: 'rewards', rules: notificationToggles }) && createRewardNotifications(webhookData),
    createDocumentNotifications(webhookData),
    createForumNotifications(webhookData),
    createCardNotifications(webhookData)
  ]).then((results) => {
    return results.flat().filter(isTruthy);
  });
}
