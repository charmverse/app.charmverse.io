import type { ProposalCategoryWithPermissions } from '@charmverse/core/dist/cjs/permissions';
import type { ProposalStatus, User, WorkspaceEvent } from '@charmverse/core/prisma';
import type { ProposalCategoryOperation } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { RateLimit } from 'async-sema';

import type {
  Discussion,
  GetDiscussionsResponse,
  ProposalDiscussionNotificationsContext
} from 'lib/discussion/getDiscussionTasks';
import { getPropertiesFromPage } from 'lib/discussion/getPropertiesFromPage';
import type { NotificationActor } from 'lib/notifications/mapNotificationActor';
import { mapNotificationActor } from 'lib/notifications/mapNotificationActor';
import { getPermissionsClient } from 'lib/permissions/api';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { getProposalAction } from './getProposalAction';
import type { ProposalWithCommentsAndUsers } from './interface';

export type ProposalTaskAction = 'start_discussion' | 'start_vote' | 'review' | 'discuss' | 'vote' | 'start_review';

// For a user with a large amount of space memberships, don't fire off hundreds of request simultaneously
const spacesHandledPerSecond = 10;

const spaceFetcherRateLimit = RateLimit(spacesHandledPerSecond);

export interface ProposalTask {
  id: string; // the id of the workspace event
  taskId: string;
  action: ProposalTaskAction | null;
  eventDate: Date;
  createdAt: Date;
  spaceDomain: string;
  spaceName: string;
  pageId: string;
  pageTitle: string;
  pagePath: string;
  status: ProposalStatus;
  createdBy: NotificationActor | null;
}

export interface ProposalTasksGroup {
  marked: ProposalTask[];
  unmarked: ProposalTask[];
}

type WorkspaceNotificationEvent = { actor: User | null } & Pick<WorkspaceEvent, 'id' | 'pageId' | 'createdAt' | 'meta'>;
type WorkspaceEventRecord = Record<string, WorkspaceNotificationEvent | null>;

function sortProposals(proposals: ProposalTask[]) {
  proposals.sort((proposalA, proposalB) => {
    return proposalA.eventDate > proposalB.eventDate ? -1 : 1;
  });
}

export async function getProposalTasks(userId: string): Promise<{
  marked: ProposalTask[];
  unmarked: ProposalTask[];
}> {
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
      space: {
        select: {
          paidTier: true
        }
      },
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
    // We should not send role-based notifications for free spaces
    .filter((spaceRole) => spaceRole.space.paidTier !== 'free')
    .map((spaceRole) => spaceRole.spaceRoleToRole)
    .flat()
    .map(({ role }) => role.id);

  const visibleCategories: ProposalCategoryWithPermissions[] = (
    await Promise.all(
      spaceIds.map((id) =>
        (async () => {
          await spaceFetcherRateLimit();
          const spacePermissionsClient = await getPermissionsClient({
            resourceId: id,
            resourceIdType: 'space'
          });
          return spacePermissionsClient.client.proposals.getAccessibleProposalCategories({
            spaceId: id,
            userId
          });
        })()
      )
    )
  ).flat();

  const categoryMap = visibleCategories.reduce((acc, category) => {
    acc[category.id] = category;
    return acc;
  }, {} as Record<string, ProposalCategoryWithPermissions>);

  const pagesWithProposals = await prisma.page.findMany({
    where: {
      deletedAt: null,
      spaceId: {
        in: spaceIds
      },
      type: 'proposal',
      proposal: {
        archived: {
          not: true
        },
        status: {
          in: ['feedback', 'review', 'reviewed', 'vote_active']
        },
        OR: [
          {
            categoryId: {
              in: visibleCategories.map((c) => c.id)
            }
          },
          {
            createdBy: userId
          },
          {
            authors: {
              some: {
                userId
              }
            }
          },
          {
            reviewers: {
              some: {
                userId
              }
            }
          },
          {
            reviewers: {
              some: {
                roleId: {
                  in: roleIds
                }
              }
            }
          }
        ]
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

  const proposalsRecord: { marked: ProposalTask[]; unmarked: ProposalTask[] } = {
    marked: [],
    unmarked: []
  };

  const tasks: ProposalTask[] = [];

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

      if (!action) {
        return;
      }

      if (workspaceEvent) {
        // Check notifications are enabled for space-wide proposal notifications
        const notifyNewEvents =
          page.space.notifyNewProposals && page.space.notifyNewProposals < workspaceEvent.createdAt;
        if (!notifyNewEvents && (action === 'discuss' || action === 'vote')) {
          return;
        }
        const proposalTask = {
          id: workspaceEvent.id,
          eventDate: workspaceEvent.createdAt,
          pageId: page.id,
          pagePath: page.path,
          pageTitle: page.title,
          spaceDomain: page.space.domain,
          spaceName: page.space.name,
          status: proposal.status,
          action,
          createdBy: mapNotificationActor(workspaceEvent.actor),
          taskId: workspaceEvent.id,
          createdAt: workspaceEvent.createdAt
        };

        if (
          proposal.categoryId &&
          ((action === 'discuss' && !categoryMap[proposal.categoryId]?.permissions.comment_proposals) ||
            (action === 'vote' && !categoryMap[proposal.categoryId]?.permissions.vote_proposals))
        ) {
          // Do nothing
        } else {
          tasks.push(proposalTask);
        }
      }
    }
  });

  const userNotifications = await prisma.userNotification.findMany({
    where: {
      taskId: {
        in: tasks.map((task) => task.id)
      },
      userId
    }
  });

  tasks.forEach((task) => {
    if (!userNotifications.some((t) => t.taskId === task.id)) {
      proposalsRecord.unmarked.push(task);
    } else {
      proposalsRecord.marked.push(task);
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
