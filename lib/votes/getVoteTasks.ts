import { prisma } from 'db';
import { mapNotificationActor } from 'lib/notifications/mapNotificationActor';
import { pageMetaSelect } from 'lib/pages/server/getPageMeta';

import { aggregateVoteResult } from './aggregateVoteResult';
import { calculateVoteStatus } from './calculateVoteStatus';
import type { VoteTask } from './interfaces';

export interface VoteTasksGroup {
  marked: VoteTask[];
  unmarked: VoteTask[];
}
export async function getVoteTasks(userId: string): Promise<VoteTasksGroup> {
  const votes = await prisma.vote.findMany({
    where: {
      space: {
        spaceRoles: {
          some: {
            userId
          }
        }
      },
      context: 'inline',
      status: 'InProgress'
    },
    orderBy: {
      deadline: 'desc'
    },
    include: {
      page: {
        select: pageMetaSelect()
      },
      space: true,
      userVotes: true,
      voteOptions: true,
      author: true
    }
  });

  const now = new Date();
  const futureVotes = votes
    .filter((item) => item.deadline > now)
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  const pastVotes = votes.filter((item) => item.deadline <= now);
  const sortedVotes = [...futureVotes, ...pastVotes];

  const userNotifications = await prisma.userNotification.findMany({
    where: {
      userId,
      type: 'vote'
    }
  });
  const markedNotificationIds = new Set(userNotifications.map((userNotification) => userNotification.taskId));

  const marked: VoteTask[] = [];
  const unmarked: VoteTask[] = [];

  sortedVotes.forEach((vote) => {
    const voteStatus = calculateVoteStatus(vote);
    const userVotes = vote.userVotes;
    const { aggregatedResult, userChoice } = aggregateVoteResult({
      userId,
      userVotes,
      voteOptions: vote.voteOptions
    });

    delete (vote as any).userVotes;

    const task: VoteTask = {
      ...vote,
      aggregatedResult,
      userChoice,
      status: voteStatus,
      totalVotes: userVotes.length,
      createdBy: mapNotificationActor(vote.author),
      taskId: vote.id,
      spaceName: vote.space.name,
      spaceDomain: vote.space.domain,
      pagePath: vote.page.path
    };

    if (markedNotificationIds.has(task.id)) {
      marked.push(task);
    } else {
      unmarked.push(task);
    }
  });

  return { marked, unmarked };
}
