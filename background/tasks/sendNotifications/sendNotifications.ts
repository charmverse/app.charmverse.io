import { prisma } from 'db';
import { getBountyTasks } from 'lib/bounties/getBountyTasks';
import { getDiscussionTasks } from 'lib/discussion/getDiscussionTasks';
import * as emails from 'lib/emails';
import type { PendingTasksProps } from 'lib/emails/templates/PendingTasks';
import { getForumTasks } from 'lib/forums/comments/getForumTasks';
import type { GnosisSafeTasks } from 'lib/gnosis/gnosis.tasks';
import { getPendingGnosisTasks } from 'lib/gnosis/gnosis.tasks';
import log from 'lib/log';
import * as mailer from 'lib/mailer';
import { getProposalTasksFromWorkspaceEvents } from 'lib/proposal/getProposalTasksFromWorkspaceEvents';
import { getVoteTasks } from 'lib/votes/getVoteTasks';

export async function sendUserNotifications(): Promise<number> {
  const notificationsToSend = await getNotifications();

  for (const notification of notificationsToSend) {
    log.info('Debug: send notification to user', { userId: notification.user.id, tasks: notification.totalTasks });
    await sendNotification(notification);
  }

  return notificationsToSend.length;
}

// note: the email only notifies the first task of each safe
const getGnosisSafeTaskId = (task: GnosisSafeTasks) => task.tasks[0].transactions[0].id;

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
      AND: [{ email: { not: null } }, { email: { not: '' } }]
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

  // Because we have a large number of queries in parallel we need to avoid Promise.all and chain them one by one
  const notifications = await activeUsersWithSafes.reduce(async (acc, user) => {
    const accPromise = await acc;
    const gnosisSafeTasks = user.gnosisSafes.length > 0 ? await getPendingGnosisTasks(user.id) : [];
    const discussionTasks = await getDiscussionTasks(user.id);
    const voteTasks = await getVoteTasks(user.id);
    const bountyTasks = await getBountyTasks(user.id);
    const forumTasks = await getForumTasks(user.id);

    const sentTasks = await prisma.userNotification.findMany({
      where: {
        taskId: {
          in: [
            ...gnosisSafeTasks.map(getGnosisSafeTaskId),
            ...voteTasks.map((voteTask) => voteTask.id),
            ...workspaceEvents.map((workspaceEvent) => workspaceEvent.id)
          ]
        },
        userId: user.id
      },
      select: {
        taskId: true
      }
    });

    const sentTaskIds = new Set(sentTasks.map((sentTask) => sentTask.taskId));

    const voteTasksNotSent = voteTasks.filter((voteTask) => !sentTaskIds.has(voteTask.id));
    const gnosisSafeTasksNotSent = gnosisSafeTasks.filter(
      (gnosisSafeTask) => !sentTaskIds.has(getGnosisSafeTaskId(gnosisSafeTask))
    );
    const myGnosisTasksNotSent = gnosisSafeTasksNotSent.filter((gnosisSafeTask) =>
      Boolean(gnosisSafeTask.tasks[0].transactions[0].myAction)
    );
    const workspaceEventsNotSent = workspaceEvents.filter((workspaceEvent) => !sentTaskIds.has(workspaceEvent.id));
    const { proposalTasks = [], unmarkedWorkspaceEvents = [] } =
      workspaceEventsNotSent.length !== 0
        ? await getProposalTasksFromWorkspaceEvents(user.id, workspaceEventsNotSent)
        : {};

    const totalTasks =
      myGnosisTasksNotSent.length +
      discussionTasks.unmarked.length +
      voteTasksNotSent.length +
      proposalTasks.length +
      bountyTasks.unmarked.length +
      forumTasks.unmarked.length;

    log.debug('Found tasks for notification', {
      notSent:
        myGnosisTasksNotSent.length +
        voteTasksNotSent.length +
        discussionTasks.unmarked.length +
        proposalTasks.length +
        bountyTasks.unmarked.length +
        forumTasks.unmarked.length,
      gnosisSafeTasks: gnosisSafeTasks.length,
      myGnosisTasks: myGnosisTasksNotSent.length
    });

    return [
      ...accPromise,
      {
        user: user as PendingTasksProps['user'],
        gnosisSafeTasks: myGnosisTasksNotSent,
        totalTasks,
        // Get only the unmarked discussion tasks
        discussionTasks: discussionTasks.unmarked,
        voteTasks: voteTasksNotSent,
        proposalTasks,
        unmarkedWorkspaceEvents,
        bountyTasks: bountyTasks.unmarked,
        forumTasks: forumTasks.unmarked
      }
    ];
  }, Promise.resolve([] as (PendingTasksProps & { unmarkedWorkspaceEvents: string[] })[]));

  return notifications.filter((notification) => notification.totalTasks > 0);
}

async function sendNotification(
  notification: PendingTasksProps & {
    unmarkedWorkspaceEvents: string[];
  }
) {
  const template = emails.getPendingTasksEmail(notification);
  const { html, subject } = template;

  try {
    // remember that we sent these tasks
    await prisma.$transaction([
      ...notification.gnosisSafeTasks.map((task) =>
        prisma.userNotification.create({
          data: {
            userId: notification.user.id,
            taskId: getGnosisSafeTaskId(task),
            channel: 'email',
            type: 'multisig'
          }
        })
      ),
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
            taskId: discussionTask.mentionId ?? discussionTask.commentId ?? '',
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
      ...notification.forumTasks
        .filter((forumTask) => forumTask.commentId)
        .map((forumTask) =>
          prisma.userNotification.create({
            data: {
              userId: notification.user.id,
              taskId: forumTask.commentId as string,
              channel: 'email',
              type: 'post_comment'
            }
          })
        ),
      ...notification.forumTasks
        .filter((forumTask) => forumTask.mentionId)
        .map((forumTask) =>
          prisma.userNotification.create({
            data: {
              userId: notification.user.id,
              taskId: forumTask.mentionId as string,
              channel: 'email',
              type: 'mention'
            }
          })
        )
    ]);
  } catch (error) {
    log.error(`Updating notifications failed for the user ${notification.user.id}`, { error });
    return undefined;
  }

  const result = await mailer.sendEmail({
    to: {
      displayName: notification.user.username,
      email: notification.user.email
    },
    subject,
    html
  });

  return result;
}
