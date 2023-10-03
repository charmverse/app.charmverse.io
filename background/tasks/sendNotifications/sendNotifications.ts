import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { RateLimit } from 'async-sema';

import { getBountyTasks } from 'lib/bounties/getBountyTasks';
import { getForumTasks } from 'lib/forums/getForumNotifications/getForumTasks';
import * as mailer from 'lib/mailer';
import * as emails from 'lib/mailer/emails';
import type { PendingNotifications } from 'lib/mailer/emails/templates/PendingTasksTemplate';
import { getDiscussionNotifications } from 'lib/notifications/getDiscussionNotifications';
import { getProposalStatusChangeTasks } from 'lib/proposal/getProposalStatusChangeTasks';
import { isUUID } from 'lib/utilities/strings';
import { getVoteTasks } from 'lib/votes/getVoteTasks';

const notificationTaskLimiter = RateLimit(100);

export async function sendUserNotifications(): Promise<number> {
  const notificationsToSend = await getNotifications();

  for (const notification of notificationsToSend) {
    log.info('Debug: send notification to user', {
      userId: notification.user.id,
      tasks: notification.totalNotifications
    });
    await sendNotification(notification);
  }

  return notificationsToSend.length;
}

export async function getNotifications(): Promise<(PendingNotifications & { unmarkedWorkspaceEvents: string[] })[]> {
  // Get all the workspace events within the past day
  const workspaceEvents = await prisma.workspaceEvent.findMany({
    where: {
      createdAt: {
        lte: new Date(),
        gte: new Date(Date.now() - 1000 * 60 * 60 * 24)
      },
      type: 'proposal_status_change'
    }
  });

  const usersWithSafes = await prisma.user.findMany({
    where: {
      deletedAt: null,
      AND: [{ email: { not: null } }, { email: { not: '' } }, { emailNotifications: true }]
    },
    // select only the fields that are needed
    select: {
      gnosisSafes: true,
      notificationState: true,
      id: true,
      username: true,
      email: true
    }
  });

  // filter out users that have snoozed notifications
  const activeUsersWithSafes = usersWithSafes.filter((user) => {
    const snoozedUntil = user.notificationState?.snoozedUntil;
    return !snoozedUntil || snoozedUntil > new Date();
  });

  const notifications: (PendingNotifications & { unmarkedWorkspaceEvents: string[] })[] = [];

  // Because we have a large number of queries in parallel we need to avoid Promise.all and chain them one by one
  for (const user of activeUsersWithSafes) {
    // Since we will be calling permissions API, we want to ensure we don't flood it with requests
    await notificationTaskLimiter();

    const sentTasks = await prisma.userNotification.findMany({
      where: {
        taskId: {
          in: [...workspaceEvents.map((workspaceEvent) => workspaceEvent.id)]
        },
        userId: user.id
      },
      select: {
        taskId: true
      }
    });

    const sentTaskIds = new Set(sentTasks.map((sentTask) => sentTask.taskId));

    const workspaceEventsNotSent = workspaceEvents.filter((workspaceEvent) => !sentTaskIds.has(workspaceEvent.id));
    const { proposalTasks: proposalNotifications = [], unmarkedWorkspaceEvents = [] } =
      workspaceEventsNotSent.length !== 0 ? await getProposalStatusChangeTasks(user.id, workspaceEventsNotSent) : {};

    const [discussionNotifications, voteNotifications, bountyNotifications, forumNotifications] = await Promise.all([
      getDiscussionNotifications(user.id),
      getVoteTasks(user.id),
      getBountyTasks(user.id),
      getForumTasks(user.id)
    ]);

    const totalNotifications =
      discussionNotifications.unmarked.length +
      voteNotifications.unmarked.length +
      proposalNotifications.length +
      bountyNotifications.unmarked.length +
      forumNotifications.unmarked.length;

    log.debug('Found tasks for notification', {
      notSent: totalNotifications
    });

    notifications.push({
      user: user as PendingNotifications['user'],
      totalNotifications,
      discussionNotifications: discussionNotifications.unmarked,
      voteNotifications: voteNotifications.unmarked,
      proposalNotifications,
      unmarkedWorkspaceEvents,
      bountyNotifications: bountyNotifications.unmarked,
      forumNotifications: forumNotifications.unmarked
    });
  }

  return notifications.filter((notification) => notification.totalNotifications > 0);
}

async function sendNotification(
  notification: PendingNotifications & {
    unmarkedWorkspaceEvents: string[];
  }
) {
  const notificationIds = [
    ...notification.proposalNotifications.map((proposalTask) => proposalTask.taskId),
    ...notification.discussionNotifications.map((discussionTask) => discussionTask.taskId),
    ...notification.voteNotifications.map((voteTask) => voteTask.taskId),
    ...notification.bountyNotifications.map((bountyTask) => bountyTask.taskId),
    ...notification.forumNotifications.map((forumTask) => forumTask.taskId)
  ].filter((nid) => isUUID(nid));

  try {
    await prisma.$transaction([
      prisma.userNotificationMetadata.updateMany({
        where: {
          id: {
            in: notificationIds
          }
        },
        data: {
          seenAt: new Date(),
          channel: 'email'
        }
      }),
      ...notification.proposalNotifications.map((proposalTask) =>
        prisma.userNotification.create({
          data: {
            userId: notification.user.id,
            taskId: proposalTask.taskId,
            channel: 'email',
            type: 'proposal'
          }
        })
      ),
      ...notification.unmarkedWorkspaceEvents.map((unmarkedWorkspaceEvent) =>
        prisma.userNotification.create({
          data: {
            userId: notification.user.id,
            taskId: unmarkedWorkspaceEvent,
            channel: 'email',
            type: 'proposal'
          }
        })
      ),
      ...notification.voteNotifications.map((voteTask) =>
        prisma.userNotification.create({
          data: {
            userId: notification.user.id,
            taskId: voteTask.taskId,
            channel: 'email',
            type: 'vote'
          }
        })
      ),
      ...notification.discussionNotifications.map((discussionTask) =>
        prisma.userNotification.create({
          data: {
            userId: notification.user.id,
            taskId:
              discussionTask.mentionId ??
              discussionTask.inlineCommentId ??
              discussionTask.blockCommentId ??
              discussionTask.taskId ??
              '',
            channel: 'email',
            type: 'mention'
          }
        })
      ),
      ...notification.bountyNotifications.map((bountyTask) =>
        prisma.userNotification.create({
          data: {
            userId: notification.user.id,
            taskId: bountyTask.taskId,
            channel: 'email',
            type: 'bounty'
          }
        })
      ),
      ...notification.forumNotifications.map((forumTask) =>
        prisma.userNotification.create({
          data: {
            userId: notification.user.id,
            taskId: forumTask.taskId,
            channel: 'email',
            type: 'forum'
          }
        })
      )
    ]);
  } catch (error) {
    log.error(`Error trying to save notification for user`, {
      userId: notification.user.id,
      error,
      forumTaskIds: notification.forumNotifications.map((forumTask) => forumTask.taskId),
      proposalTaskIds: notification.proposalNotifications.map((proposalTask) => proposalTask.taskId),
      unmarkedWorkspaceEventIds: notification.unmarkedWorkspaceEvents,
      voteTaskIds: notification.voteNotifications.map((voteTask) => voteTask.taskId),
      discussionTaskIds: notification.discussionNotifications.map(
        (discussionTask) =>
          discussionTask.mentionId ??
          discussionTask.inlineCommentId ??
          discussionTask.blockCommentId ??
          discussionTask.taskId ??
          ''
      ),
      bountyTaskIds: notification.bountyNotifications.map((bountyTask) => bountyTask.taskId)
    });
    return undefined;
  }

  const template = emails.getPendingTasksEmail(notification);
  const result = await mailer.sendEmail({
    to: {
      displayName: notification.user.username,
      email: notification.user.email
    },
    subject: template.subject,
    html: template.html
  });

  return result;
}
