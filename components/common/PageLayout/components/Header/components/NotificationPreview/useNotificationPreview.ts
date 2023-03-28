import { NotificationType } from '@prisma/client';
import { useMemo } from 'react';

import useTasks from 'components/nexus/hooks/useTasks';
import type { BountyTask } from 'lib/bounties/getBountyTasks';
import type { DiscussionTask } from 'lib/discussion/interfaces';
import type { ForumTask } from 'lib/forums/getForumNotifications/getForumNotifications';
import type { NotificationGroupType } from 'lib/notifications/interfaces';
import type { ProposalTask } from 'lib/proposal/getProposalTasks';
import type { VoteTask } from 'lib/votes/interfaces';

type NotificationPreview = VoteTask | ProposalTask | BountyTask | DiscussionTask | ForumTask;

export function useNotificationPreview() {
  const { tasks, gnosisTasks } = useTasks();

  // @TODOM - verify data, add proper titles, add gnosis notifications
  const notificationPreviews = useMemo(() => {
    if (!tasks) return [];

    return [
      ...getNotificationPreviewItems(tasks.votes.unmarked, 'votes'),
      ...getNotificationPreviewItems(tasks.proposals.unmarked, 'proposals'),
      ...getNotificationPreviewItems(tasks.bounties.unmarked, 'bounties'),
      ...getNotificationPreviewItems(tasks.discussions.unmarked, 'discussions'),
      ...getNotificationPreviewItems(tasks.forum.unmarked, 'forum')
    ].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }, [tasks]);

  return { notificationPreviews };
}

function getNotificationPreviewItems(notifications: NotificationPreview[], type: NotificationGroupType) {
  return notifications.map((n) => ({
    id: n.taskId,
    createdAt: n.createdAt,
    createdBy: n.createdBy,
    spaceName: n.spaceName,
    groupType: type,
    title: getNotificationPreviewTitle(n),
    type: getNotificationPreviewType(n)
  }));
}

function getNotificationPreviewTitle(notification: NotificationPreview) {
  if ('postTitle' in notification) {
    return notification.postTitle;
  }

  if ('pageTitle' in notification) {
    return notification.pageTitle;
  }

  if ('title' in notification) {
    return notification.title;
  }

  return '';
}

function getNotificationPreviewType(notification: NotificationPreview): NotificationType {
  // @TODOM - map types

  return NotificationType.forum;
}
