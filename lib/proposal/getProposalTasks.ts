import { prisma } from '@charmverse/core/prisma-client';
import type { PageComment, Proposal } from '@charmverse/core/prisma-client';
import type { ProposalWithCommentsAndUsers } from '@charmverse/core/proposals';

import type { SpaceRecord } from 'lib/discussion/getDiscussionTasks';
import type { DiscussionPropertiesFromPage } from 'lib/discussion/getPropertiesFromPage';
import { getPropertiesFromPage } from 'lib/discussion/getPropertiesFromPage';
import type { NotificationActor, NotificationsGroup, ProposalNotification } from 'lib/notifications/interfaces';
import { getPermissionsClient } from 'lib/permissions/api';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { shortenHex } from 'lib/utilities/blockchain';

import { getProposalStatusChangeTasks } from './getProposalStatusChangeTasks';

function sortProposals(proposals: ProposalNotification[]) {
  proposals.sort((proposalA, proposalB) => {
    return proposalA.createdAt > proposalB.createdAt ? -1 : 1;
  });
}

export interface GetProposalNotificationsResponse {
  mentions: ProposalNotification[];
  comments: ProposalNotification[];
}

export async function getProposalTasks(userId: string): Promise<NotificationsGroup<ProposalNotification>> {
  const workspaceEvents = await prisma.workspaceEvent.findMany({
    where: {
      type: 'proposal_status_change'
    },
    select: {
      pageId: true,
      createdAt: true,
      meta: true,
      id: true,
      actor: true,
      spaceId: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  const { proposalTasks } = await getProposalStatusChangeTasks(userId, workspaceEvents);
  const proposalDiscussionTasks = await getProposalDiscussionTasks(userId);

  const proposalTaskIds = [
    ...proposalTasks.map((task) => task.taskId),
    ...proposalDiscussionTasks.comments.map((task) => task.taskId),
    ...proposalDiscussionTasks.mentions.map((task) => task.taskId)
  ];

  const userNotifications = await prisma.userNotification.findMany({
    where: {
      taskId: {
        in: proposalTaskIds
      },
      userId
    }
  });

  const proposalsRecord = [
    ...proposalTasks,
    ...proposalDiscussionTasks.comments,
    ...proposalDiscussionTasks.mentions
  ].reduce<{ marked: ProposalNotification[]; unmarked: ProposalNotification[] }>(
    (acc, task) => {
      if (!userNotifications.some((t) => t.taskId === task.taskId)) {
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

export type NotificationProposalData = Pick<Proposal, 'id' | 'createdBy' | 'spaceId' | 'status'> & {
  page: DiscussionPropertiesFromPage & { comments: (PageComment & { user: NotificationActor })[] };
};

export type ProposalDiscussionNotificationsContext = {
  userId: string;
  spaceRecord: SpaceRecord;
  username: string;
  proposals: NotificationProposalData[];
};

export async function getProposalDiscussionTasks(userId: string): Promise<GetProposalNotificationsResponse> {
  // Get all the space the user is part of
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId
    },
    select: {
      spaceId: true
    }
  });

  // Get the username of the user, its required when constructing the mention message text
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      username: true
    }
  });

  const username = user?.username ?? shortenHex(userId);

  // Array of space ids the user is part of
  const spaceIds = spaceRoles.map((spaceRole) => spaceRole.spaceId);

  const spaces = await prisma.space.findMany({
    where: {
      id: {
        in: spaceIds
      }
    },
    select: {
      domain: true,
      id: true,
      name: true
    }
  });

  const spaceRecord: SpaceRecord = {};

  spaces.forEach((space) => {
    spaceRecord[space.id] = space;
  });

  const { mentions, comments } = {
    mentions: [],
    comments: []
  } as GetProposalNotificationsResponse;

  for (const spaceId of spaceIds) {
    const userProposalIds = (await getPermissionsClient({ resourceId: spaceId, resourceIdType: 'space' }).then(
      ({ client }) =>
        client.proposals.getAccessibleProposalIds({
          userId,
          spaceId
        })
    )) as ProposalWithCommentsAndUsers[];

    const proposals = (await prisma.proposal.findMany({
      where: {
        spaceId,
        id: {
          in: userProposalIds.map(({ id }) => id)
        }
      },
      select: {
        id: true,
        createdBy: true,
        status: true,
        page: {
          select: {
            id: true,
            spaceId: true,
            title: true,
            path: true,
            bountyId: true,
            comments: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatar: true,
                    avatarChain: true,
                    avatarContract: true,
                    avatarTokenId: true
                  }
                }
              }
            }
          }
        }
      }
    })) as NotificationProposalData[];

    const context: ProposalDiscussionNotificationsContext = { userId, username, spaceRecord, proposals };

    // aggregate the results
    [getProposalComments(context), getProposalCommentMentions(context)].forEach((result) => {
      mentions.push(...result.mentions);
      comments.push(...result.comments);
    });
  }

  return {
    mentions,
    comments
  };
}

export function getProposalComments({
  proposals,
  userId,
  spaceRecord
}: ProposalDiscussionNotificationsContext): GetProposalNotificationsResponse {
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

  const commentReplies = [
    ...commentsOnTheUserPage.map((c) => ({ ...c, reply: false })),
    ...repliesToUserComments.map((c) => ({ ...c, reply: true }))
  ];

  const commentTasks = commentReplies.map((comment) => {
    const proposalNotification: ProposalNotification = {
      ...getPropertiesFromPage(
        proposalRecord[comment.pageId].page,
        spaceRecord[proposalRecord[comment.pageId].page.spaceId]
      ),
      createdAt: new Date(comment.createdAt).toISOString(),
      commentId: comment.id,
      mentionId: null,
      type: comment.reply ? 'comment.replied' : 'comment.created',
      taskId: comment.id,
      createdBy: comment.user,
      status: proposalRecord[comment.pageId].status,
      inlineCommentId: null
    };
    return proposalNotification;
  });

  return {
    mentions: [],
    comments: commentTasks
  };
}

export function getProposalCommentMentions({
  userId,
  username,
  spaceRecord,
  proposals
}: ProposalDiscussionNotificationsContext): GetProposalNotificationsResponse {
  const mentions: ProposalNotification[] = [];

  for (const proposal of proposals) {
    for (const comment of proposal.page.comments) {
      const content = comment.content as PageContent;
      if (content) {
        const extractedMentions = extractMentions(content, username);
        extractedMentions.forEach((mention) => {
          if (mention.value === userId && mention.createdBy !== userId && comment.createdBy !== userId) {
            mentions.push({
              ...getPropertiesFromPage(proposal.page, spaceRecord[proposal.spaceId]),
              mentionId: mention.id,
              createdAt: mention.createdAt,
              createdBy: comment.user,
              inlineCommentId: null,
              pageId: proposal.page.id,
              pagePath: proposal.page.path,
              pageTitle: proposal.page.title,
              spaceDomain: spaceRecord[proposal.spaceId].domain,
              spaceId: proposal.spaceId,
              spaceName: spaceRecord[proposal.spaceId].name,
              status: proposal.status,
              commentId: comment.id,
              type: 'comment.mention.created',
              taskId: comment.id
            });
          }
        });
      }
    }
  }

  return {
    comments: [],
    mentions
  };
}
