
import { prisma } from 'db';
import { getBountyTasks } from 'lib/bounties/getBountyTasks';
import { getDiscussionTasks } from 'lib/discussion/getDiscussionTasks';
import * as emails from 'lib/emails';
import type { PendingTasksProps } from 'lib/emails/templates/PendingTasks';
import type { GnosisSafeTasks } from 'lib/gnosis/gnosis.tasks';
import { getPendingGnosisTasks } from 'lib/gnosis/gnosis.tasks';
import log from 'lib/log';
import * as mailer from 'lib/mailer';
import { getProposalTasksFromWorkspaceEvents } from 'lib/proposal/getProposalTasksFromWorkspaceEvents';
import { getVoteTasks } from 'lib/votes/getVoteTasks';

export async function sendUserNotifications (): Promise<number> {

  const notificationsToSend = await getNotifications();

  for (const notification of notificationsToSend) {
    log.info('Debug: send notification to user', { userId: notification.user.id, tasks: notification.totalTasks });
    await sendNotification(notification);
  }

  return notificationsToSend.length;
}

// note: the email only notifies the first task of each safe
const getGnosisSafeTaskId = (task: GnosisSafeTasks) => task.tasks[0].transactions[0].id;

export async function getNotifications (): Promise<(PendingTasksProps & { unmarkedWorkspaceEvents: string[] })[]> {

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
      AND: [
        { email: { not: null } },
        { email: { not: '' } }
      ]
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
  const activeUsersWithSafes = usersWithSafes.filter(user => {
    const snoozedUntil = user.notificationState?.snoozedUntil;
    return (!snoozedUntil || snoozedUntil > new Date());
  });

  const notifications = await Promise.all(activeUsersWithSafes.map(async user => {
    const gnosisSafeTasks = user.gnosisSafes.length > 0 ? await getPendingGnosisTasks(user.id) : [];
    const discussionTasks = await getDiscussionTasks(user.id);
    const voteTasks = await getVoteTasks(user.id);
    const bountyTasks = await getBountyTasks(user.id);

    const sentTasks = await prisma.userNotification.findMany({
      where: {
        taskId: {
          in: [
            ...gnosisSafeTasks.map(getGnosisSafeTaskId),
            ...voteTasks.map(voteTask => voteTask.id),
            ...workspaceEvents.map(workspaceEvent => workspaceEvent.id)
          ]
        },
        userId: user.id
      },
      select: {
        taskId: true
      }
    });

    const sentTaskIds = new Set(sentTasks.map(sentTask => sentTask.taskId));

    const voteTasksNotSent = voteTasks.filter(voteTask => !sentTaskIds.has(voteTask.id));
    const gnosisSafeTasksNotSent = gnosisSafeTasks.filter(gnosisSafeTask => !sentTaskIds.has(getGnosisSafeTaskId(gnosisSafeTask)));
    const myGnosisTasks = gnosisSafeTasksNotSent.filter(gnosisSafeTask => Boolean(gnosisSafeTask.tasks[0].transactions[0].myAction));
    const workspaceEventsNotSent = workspaceEvents.filter(workspaceEvent => !sentTaskIds.has(workspaceEvent.id));
    const { proposalTasks = [], unmarkedWorkspaceEvents = [] } = workspaceEventsNotSent.length !== 0
      ? await getProposalTasksFromWorkspaceEvents(user.id, workspaceEventsNotSent) : {};

    const totalTasks = myGnosisTasks.length
      + discussionTasks.unmarked.length
      + voteTasksNotSent.length
      + proposalTasks.length
      + bountyTasks.unmarked.length;

    log.debug('Found tasks for notification', {
      notSent: gnosisSafeTasksNotSent.length
       + voteTasksNotSent.length
       + discussionTasks.unmarked.length
       + proposalTasks.length
       + bountyTasks.unmarked.length,
      gnosisSafeTasks: gnosisSafeTasks.length,
      myGnosisTasks: myGnosisTasks.length
    });

    return {
      user: user as PendingTasksProps['user'],
      gnosisSafeTasks: myGnosisTasks,
      totalTasks,
      // Get only the unmarked discussion tasks
      discussionTasks: discussionTasks.unmarked,
      voteTasks: voteTasksNotSent,
      proposalTasks,
      unmarkedWorkspaceEvents,
      bountyTasks: bountyTasks.unmarked
    };
  }));

  return notifications.filter(notification => notification.totalTasks > 0);
}

async function sendNotification (notification: PendingTasksProps & {
  unmarkedWorkspaceEvents: string[];
}) {
  const template = emails.getPendingTasksEmail(notification);
  const { html, subject } = template;

  try {
    // remember that we sent these tasks
    await prisma.$transaction(
      [...notification.gnosisSafeTasks.map(task => prisma.userNotification.create({
        data: {
          userId: notification.user.id,
          taskId: getGnosisSafeTaskId(task),
          channel: 'email',
          type: 'multisig'
        }
      }))]
    );
  }
  catch (err) {
    log.debug(`GnosisSafe error with userId: ${notification.user.id}, taskIds: ${notification.gnosisSafeTasks.map(item => getGnosisSafeTaskId(item)).join(',')}`, { error: err });
    return undefined;
  }

  try {
    await prisma.$transaction(
      [...notification.proposalTasks.map(proposalTask => prisma.userNotification.create({
        data: {
          userId: notification.user.id,
          taskId: proposalTask.id,
          channel: 'email',
          type: 'proposal'
        }
      }))]
    );
  }
  catch (err) {
    log.debug(`ProposalTasks error  with userId: ${notification.user.id} , taskIds: ${notification.proposalTasks.map(item => item.id).join(',')}`, { error: err });
    return undefined;
  }

  try {
    await prisma.$transaction(
      [...notification.unmarkedWorkspaceEvents.map(unmarkedWorkspaceEvent => prisma.userNotification.create({
        data: {
          userId: notification.user.id,
          taskId: unmarkedWorkspaceEvent,
          channel: 'email',
          type: 'proposal'
        }
      }))]
    );
  }
  catch (err) {
    log.debug(`Notifications task error with userId: ${notification.user.id} , taskIds: ${notification.unmarkedWorkspaceEvents.join(',')}`, { error: err });
    return undefined;
  }

  try {
    await prisma.$transaction(
      [...notification.voteTasks.map(voteTask => prisma.userNotification.create({
        data: {
          userId: notification.user.id,
          taskId: voteTask.id,
          channel: 'email',
          type: 'vote'
        }
      }))]
    );
  }
  catch (err) {
    log.debug(`Votes Tasks error for  userId: ${notification.user.id}, taskIds: ${notification.voteTasks.map(voteTask => voteTask.id).join(',')}`, { error: err });
    return undefined;
  }

  try {
    await prisma.$transaction(
      [...notification.discussionTasks.map(discussionTask => prisma.userNotification.create({
        data: {
          userId: notification.user.id,
          taskId: discussionTask.mentionId ?? discussionTask.commentId ?? '',
          channel: 'email',
          type: 'mention'
        }
      }))]
    );
  }
  catch (err) {
    log.debug(`Discussion Tasks error with userId:${notification.user.id} , tasksMentionIds: ${notification.discussionTasks.map(item => item.mentionId).join(',')}, tasksCommentIds: ${notification.discussionTasks.map(item => item.commentId)}`, { error: err });
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
