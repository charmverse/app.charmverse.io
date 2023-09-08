import { prisma } from '@charmverse/core/prisma-client';

import type { Discussion, GetDiscussionsResponse } from 'lib/discussion/getDiscussionTasks';
import { getPropertiesFromPage } from 'lib/discussion/getPropertiesFromPage';
import type {
  NotificationProposalData,
  ProposalDiscussionNotificationsContext
} from 'lib/discussion/getProposalDiscussionTasks';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { ProposalTask } from './getProposalStatusChangeTasks';
import { getProposalStatusChangeTasks } from './getProposalStatusChangeTasks';
import type { ProposalWithCommentsAndUsers } from './interface';

export type ProposalTasksGroup = {
  marked: ProposalTask[];
  unmarked: ProposalTask[];
};

function sortProposals(proposals: ProposalTask[]) {
  proposals.sort((proposalA, proposalB) => {
    return proposalA.eventDate > proposalB.eventDate ? -1 : 1;
  });
}

export async function getProposalTasks(userId: string): Promise<ProposalTasksGroup> {
  const workspaceEvents = await prisma.workspaceEvent.findMany({
    where: {
      type: 'proposal_status_change'
    },
    select: {
      pageId: true,
      createdAt: true,
      meta: true,
      id: true,
      actor: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  const { proposalTasks } = await getProposalStatusChangeTasks(userId, workspaceEvents);
  const userNotifications = await prisma.userNotification.findMany({
    where: {
      taskId: {
        in: proposalTasks.map((task) => task.id)
      },
      userId
    }
  });

  const proposalsRecord = proposalTasks.reduce<{ marked: ProposalTask[]; unmarked: ProposalTask[] }>(
    (acc, task) => {
      if (!userNotifications.some((t) => t.taskId === task.id)) {
        acc.unmarked.push(task);
      } else {
        acc.marked.push(task);
      }
      return acc;
    },
    {
      marked: [],
      unmarked: []
    }
  );

  sortProposals(proposalsRecord.marked);
  sortProposals(proposalsRecord.unmarked);

  return proposalsRecord;
}

export function getProposalComments({
  proposals,
  userId,
  spaceRecord
}: ProposalDiscussionNotificationsContext): GetDiscussionsResponse {
  const proposalRecord = proposals.reduce<Record<string, NotificationProposalData>>((acc, proposal) => {
    acc[proposal.id] = proposal;
    return acc;
  }, {});
  const allComments = proposals.flatMap((proposal) => proposal.page.comments);

  const commentIdsFromUser = allComments.filter((comment) => comment.createdBy === userId).map((comment) => comment.id);
  const commentsFromOthers = allComments.filter((comment) => comment.createdBy !== userId);

  // Comments that are not created by the user but are on a proposal page created by the user
  const commentsOnTheUserPage = proposals
    .filter((proposal) => proposal.createdBy === userId)
    .flatMap((proposal) => proposal.page.comments)
    // only top-level comments
    .filter((comment) => comment.createdBy !== userId && !comment.parentId);

  const repliesToUserComments = commentsFromOthers.filter((comment) =>
    commentIdsFromUser.includes(comment.parentId ?? '')
  );

  const commentReplies = [...commentsOnTheUserPage, ...repliesToUserComments];

  const commentTasks = commentReplies.map((comment) => {
    return {
      ...getPropertiesFromPage(
        proposalRecord[comment.pageId].page,
        spaceRecord[proposalRecord[comment.pageId].page.spaceId]
      ),
      createdAt: new Date(comment.createdAt).toISOString(),
      userId: comment.createdBy,
      text: comment.contentText,
      commentId: comment.id,
      mentionId: null,
      type: 'proposal'
    } as Discussion;
  });

  return {
    mentions: [],
    discussionUserIds: commentTasks.map((comm) => comm.userId).concat([userId]),
    comments: commentTasks
  };
}

export function getProposalCommentMentions({
  userId,
  username,
  spaceRecord,
  proposals
}: ProposalDiscussionNotificationsContext): GetDiscussionsResponse {
  const mentions: Discussion[] = [];
  const discussionUserIds: string[] = [];

  for (const proposal of proposals) {
    for (const comment of proposal.page.comments) {
      const content = comment.content as PageContent;
      if (content) {
        const extractedMentions = extractMentions(content, username);
        extractedMentions.forEach((mention) => {
          if (mention.value === userId && mention.createdBy !== userId && comment.createdBy !== userId) {
            discussionUserIds.push(mention.createdBy);
            mentions.push({
              ...getPropertiesFromPage(proposal.page, spaceRecord[proposal.spaceId]),
              mentionId: mention.id,
              createdAt: mention.createdAt,
              userId: mention.createdBy,
              text: mention.text,
              commentId: comment.id,
              type: 'proposal',
              taskId: comment.id
            });
          }
        });
      }
    }
  }

  return {
    comments: [],
    mentions,
    discussionUserIds
  };
}
