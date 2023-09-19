import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { RateLimit } from 'async-sema';

import { getBountyTasks } from 'lib/bounties/getBountyTasks';
import { getDiscussionNotifications } from 'lib/discussion/getDiscussionNotifications';
import { getForumNotifications } from 'lib/forums/getForumNotifications/getForumNotifications';
import * as mailer from 'lib/mailer';
import * as emails from 'lib/mailer/emails';
import type { PendingTasksProps } from 'lib/mailer/emails/templates/PendingTasksTemplate';
import { getProposalStatusChangeTasks } from 'lib/proposal/getProposalStatusChangeTasks';
import { getVoteTasks } from 'lib/votes/getVoteTasks';

const notificationTaskLimiter = RateLimit(100);

export async function sendUserNotifications(): Promise<number> {
  const notificationsToSend = await getNotifications();

  for (const notification of notificationsToSend) {
    log.info('Debug: send notification to user', { userId: notification.user.id, tasks: notification.totalTasks });
    await sendNotification(notification);
  }

  return notificationsToSend.length;
}

export async function getNotifications(): Promise<(PendingTasksProps & { unmarkedWorkspaceEvents: string[] })[]> {
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

  const notifications: (PendingTasksProps & { unmarkedWorkspaceEvents: string[] })[] = [];

  // Because we have a large number of queries in parallel we need to avoid Promise.all and chain them one by one
  for (const user of activeUsersWithSafes) {
    // Since we will be calling permissions API, we want to ensure we don't flood it with requests
    await notificationTaskLimiter();

    const discussionTasks = await getDiscussionNotifications(user.id);
    const voteTasks = await getVoteTasks(user.id);
    const bountyTasks = await getBountyTasks(user.id);
    const forumTasks = await getForumNotifications(user.id);

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

    const voteTasksNotSent = voteTasks.unmarked;
    const workspaceEventsNotSent = workspaceEvents.filter((workspaceEvent) => !sentTaskIds.has(workspaceEvent.id));
    const { proposalTasks = [], unmarkedWorkspaceEvents = [] } =
      workspaceEventsNotSent.length !== 0 ? await getProposalStatusChangeTasks(user.id, workspaceEventsNotSent) : {};

    const totalTasks =
      discussionTasks.unmarked.length +
      voteTasksNotSent.length +
      proposalTasks.length +
      bountyTasks.unmarked.length +
      forumTasks.unmarked.length;

    log.debug('Found tasks for notification', {
      notSent:
        voteTasksNotSent.length +
        discussionTasks.unmarked.length +
        proposalTasks.length +
        bountyTasks.unmarked.length +
        forumTasks.unmarked.length
    });

    notifications.push({
      user: user as PendingTasksProps['user'],
      totalTasks,
      // Get only the unmarked discussion tasks
      discussionTasks: discussionTasks.unmarked,
      voteTasks: voteTasksNotSent,
      proposalTasks,
      unmarkedWorkspaceEvents,
      bountyTasks: bountyTasks.unmarked,
      forumTasks: forumTasks.unmarked
    });
  }

  return notifications.filter((notification) => notification.totalTasks > 0);
}

async function sendNotification(
  notification: PendingTasksProps & {
    unmarkedWorkspaceEvents: string[];
  }
) {
  try {
    // remember that we sent these tasks
    await prisma.$transaction([
      ...notification.proposalTasks.map((proposalTask) =>
        prisma.userNotification.create({
          data: {
            userId: notification.user.id,
            taskId: proposalTask.id,
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
      ...notification.voteTasks.map((voteTask) =>
        prisma.userNotification.create({
          data: {
            userId: notification.user.id,
            taskId: voteTask.id,
            channel: 'email',
            type: 'vote'
          }
        })
      ),
      ...notification.discussionTasks.map((discussionTask) =>
        prisma.userNotification.create({
          data: {
            userId: notification.user.id,
            taskId: discussionTask.mentionId ?? discussionTask.commentId ?? discussionTask.taskId ?? '',
            channel: 'email',
            type: 'mention'
          }
        })
      ),
      ...notification.bountyTasks.map((bountyTask) =>
        prisma.userNotification.create({
          data: {
            userId: notification.user.id,
            taskId: bountyTask.id,
            channel: 'email',
            type: 'bounty'
          }
        })
      ),
      ...notification.forumTasks.map((forumTask) =>
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
      forumTaskIds: notification.forumTasks.map((forumTask) => forumTask.taskId),
      proposalTaskIds: notification.proposalTasks.map((proposalTask) => proposalTask.id),
      unmarkedWorkspaceEventIds: notification.unmarkedWorkspaceEvents,
      voteTaskIds: notification.voteTasks.map((voteTask) => voteTask.id),
      discussionTaskIds: notification.discussionTasks.map(
        (discussionTask) => discussionTask.mentionId ?? discussionTask.commentId ?? discussionTask.taskId ?? ''
      ),
      bountyTaskIds: notification.bountyTasks.map((bountyTask) => bountyTask.id)
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
