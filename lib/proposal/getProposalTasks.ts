import type { ProposalStatus, WorkspaceEvent } from '@prisma/client';

import { prisma } from 'db';
import type {
  Discussion,
  GetDiscussionsResponse,
  ProposalDiscussionNotificationsContext
} from 'lib/discussion/getDiscussionTasks';
import { getPropertiesFromPage } from 'lib/discussion/getPropertiesFromPage';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { getProposalAction } from './getProposalAction';
import type { ProposalWithCommentsAndUsers } from './interface';

export type ProposalTaskAction = 'start_discussion' | 'start_vote' | 'review' | 'discuss' | 'vote' | 'start_review';

export interface ProposalTask {
  id: string; // the id of the workspace event
  action: ProposalTaskAction | null;
  eventDate: Date;
  spaceDomain: string;
  spaceName: string;
  pageId: string;
  pageTitle: string;
  pagePath: string;
  status: ProposalStatus;
}

export interface ProposalTasksGroup {
  marked: ProposalTask[];
  unmarked: ProposalTask[];
}

type WorkspaceEventRecord = Record<string, Pick<WorkspaceEvent, 'id' | 'pageId' | 'createdAt' | 'meta'> | null>;

function sortProposals(proposals: ProposalTask[]) {
  proposals.sort((proposalA, proposalB) => {
    return proposalA.eventDate > proposalB.eventDate ? -1 : 1;
  });
}

export async function getProposalTasks(userId: string): Promise<{
  marked: ProposalTask[];
  unmarked: ProposalTask[];
}> {
  const userNotifications = await prisma.userNotification.findMany({
    where: {
      userId
    }
  });

  const workspaceEvents = await prisma.workspaceEvent.findMany({
    where: {
      type: 'proposal_status_change'
    },
    select: {
      pageId: true,
      createdAt: true,
      meta: true,
      id: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Ensures we only track the latest status change for each proposal
  const workspaceEventsRecord = workspaceEvents.reduce<WorkspaceEventRecord>((record, workspaceEvent) => {
    if (!record[workspaceEvent.pageId]) {
      record[workspaceEvent.pageId] = workspaceEvent;
    }
    return record;
  }, {});

  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId
    },
    select: {
      spaceId: true,
      spaceRoleToRole: {
        where: {
          spaceRole: {
            userId
          }
        },
        select: {
          role: {
            select: {
              id: true
            }
          }
        }
      }
    }
  });

  const spaceIds = spaceRoles.map((spaceRole) => spaceRole.spaceId);
  // Get all the roleId assigned to this user for each space
  const roleIds = spaceRoles
    .map((spaceRole) => spaceRole.spaceRoleToRole)
    .flat()
    .map(({ role }) => role.id);

  const pagesWithProposals = await prisma.page.findMany({
    where: {
      deletedAt: null,
      spaceId: {
        in: spaceIds
      },
      type: 'proposal',
      proposal: {
        status: {
          not: 'draft'
        }
      }
    },
    include: {
      proposal: {
        include: {
          authors: true,
          reviewers: true
        }
      },
      space: true
    }
  });

  const userNotificationIds = new Set(userNotifications.map((userNotification) => userNotification.taskId));

  const proposalsRecord: { marked: ProposalTask[]; unmarked: ProposalTask[] } = {
    marked: [],
    unmarked: []
  };

  pagesWithProposals.forEach(({ proposal, ...page }) => {
    if (proposal) {
      const workspaceEvent = workspaceEventsRecord[page.id];
      const isReviewer = proposal.reviewers.some((reviewer) =>
        reviewer.roleId ? roleIds.includes(reviewer.roleId) : reviewer.userId === userId
      );
      const isAuthor = proposal.authors.some((author) => author.userId === userId);
      const action = getProposalAction({
        currentStatus: proposal.status,
        isAuthor,
        isReviewer
      });

      if (workspaceEvent) {
        const proposalTask = {
          id: workspaceEvent.id,
          eventDate: workspaceEvent.createdAt,
          pageId: page.id,
          pagePath: page.path,
          pageTitle: page.title,
          spaceDomain: page.space.domain,
          spaceName: page.space.name,
          status: proposal.status,
          action
        };
        if (!userNotificationIds.has(workspaceEvent.id)) {
          proposalsRecord.unmarked.push(proposalTask);
        } else {
          proposalsRecord.marked.push(proposalTask);
        }
      }
    }
  });

  sortProposals(proposalsRecord.marked);
  sortProposals(proposalsRecord.unmarked);

  return proposalsRecord;
}

export function getProposalComments({
  proposals,
  userId,
  spaceRecord
}: ProposalDiscussionNotificationsContext): GetDiscussionsResponse {
  const proposalRecord = proposals.reduce<Record<string, ProposalWithCommentsAndUsers>>((acc, proposal) => {
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
      mentionId: null
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
              commentId: comment.id
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
