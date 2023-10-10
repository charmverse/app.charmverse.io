import type { WebhookEvent } from 'lib/webhookPublisher/interfaces';

import { createCardNotifications } from './cards/createCardNotifications';
import { createDocumentNotifications } from './documents/createDocumentNotifications';
import { createForumNotifications } from './forum/createForumNotifications';
import { getNotificationToggles, isNotificationEnabled } from './notificationToggles';
import { createPollNotifications } from './polls/createPollNotifications';
import { createProposalNotifications } from './proposals/createProposalNotifications';
import { createRewardNotifications } from './rewards/createRewardNotifications';

export async function createNotificationsFromEvent(webhookData: {
  createdAt: string;
  event: WebhookEvent;
  spaceId: string;
}) {
  const notificationToggles = await getNotificationToggles({ spaceId: webhookData.spaceId });
  if (isNotificationEnabled({ group: 'proposals', rules: notificationToggles })) {
    await createProposalNotifications(webhookData);
  }
  if (isNotificationEnabled({ group: 'polls', rules: notificationToggles })) {
    await createPollNotifications(webhookData);
  }
  if (isNotificationEnabled({ group: 'rewards', rules: notificationToggles })) {
    await createRewardNotifications(webhookData);
  }
  await createDocumentNotifications(webhookData);
  await createForumNotifications(webhookData);
  await createCardNotifications(webhookData);
}
