import type { ProposalCategoryWithPermissions } from '@charmverse/core/permissions';
import type {
  Page,
  ProposalStatus,
  ProposalAuthor,
  ProposalReviewer,
  Proposal,
  WorkspaceEvent,
  User
} from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { RateLimit } from 'async-sema';

import type { NotificationActor, ProposalNotification } from 'lib/notifications/interfaces';
import { mapNotificationActor } from 'lib/notifications/mapNotificationActor';
import { getPermissionsClient } from 'lib/permissions/api';

import { getProposalAction } from './getProposalAction';

type PopulatedProposal = Proposal & {
  authors: (ProposalAuthor & { author: NotificationActor })[];
  reviewers: ProposalReviewer[];
  page: Pick<Page, 'id' | 'path' | 'title' | 'deletedAt'>;
};

type ProposalStatusChangeMetaData = {
  newStatus: ProposalStatus;
  oldStatus?: ProposalStatus; // by convention, an undefined oldStatus means the proposal was just created
};

// For a user with a large amount of space memberships, don't fire off hundreds of request simultaneously
const spacesHandledPerSecond = 10;

const spaceFetcherRateLimit = RateLimit(spacesHandledPerSecond);

type WorkspaceEventSpecial = Pick<WorkspaceEvent, 'createdAt' | 'pageId' | 'id' | 'spaceId'> & {
  actor?: User | null;
  meta: any;
};

type WorkspaceEventSpecialWithMeta = WorkspaceEventSpecial & {
  meta: ProposalStatusChangeMetaData;
};

export async function getProposalStatusChangeTasks(userId: string, proposalChangeEvents: WorkspaceEventSpecial[]) {
  const proposalTasks: ProposalNotification[] = [];

  // Sort the events in descending order based on their created date to help in de-duping
  proposalChangeEvents.sort((we1, we2) => (we1.createdAt > we2.createdAt ? -1 : 1));

  // Ensures we only track the latest status change for each proposal
  const workspaceEventsMap = proposalChangeEvents.reduce((map, workspaceEvent) => {
    const existingEvent = map.get(workspaceEvent.pageId) as WorkspaceEventSpecial | undefined;

    if (!existingEvent) {
      map.set(workspaceEvent.pageId, workspaceEvent);
    } else if (new Date(existingEvent.createdAt) < new Date(workspaceEvent.createdAt)) {
      map.set(workspaceEvent.pageId, workspaceEvent);
    }
    return map;
  }, new Map());

  // Get all the spaceRole and role this user has been assigned to
  // Roles would be used to detect if the user is a reviewer of the proposal
  // SpaceRoles would be used to detect if the user is a member of the proposal space
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId
    },
    select: {
      spaceId: true,
      space: {
        select: {
          domain: true,
          name: true,
          paidTier: true,
          notifyNewProposals: true
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
  const spaceMap = spaceRoles.reduce((map, { spaceId, space }) => {
    map.set(spaceId, space);
    return map;
  }, new Map<string, (typeof spaceRoles)[number]['space']>());

  // Get all the roleId assigned to this user
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

  const categoryMap = visibleCategories.reduce((map, category) => {
    map.set(category.id, category);
    return map;
  }, new Map<string, ProposalCategoryWithPermissions>());

  const proposals = await prisma.proposal.findMany({
    where: {
      archived: {
        not: true
      },
      status: {
        in: ['discussion', 'review', 'reviewed', 'vote_active', 'evaluation_active', 'evaluation_closed']
      },
      spaceId: {
        in: spaceIds
      },
      page: {
        id: {
          in: [...workspaceEventsMap.keys()]
        }
      },
      // filter by permissions
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
    },
    include: {
      space: {
        select: {
          domain: true,
          name: true
        }
      },
      authors: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              path: true,
              avatar: true,
              avatarTokenId: true,
              avatarContract: true,
              avatarChain: true,
              deletedAt: true
            }
          }
        }
      },
      reviewers: true,
      page: {
        select: {
          id: true,
          path: true,
          title: true,
          deletedAt: true
        }
      }
    }
  });

  const proposalsMap = proposals.reduce((record, proposal) => {
    if (proposal.page) {
      record.set(proposal.page.id, proposal as PopulatedProposal);
    }
    return record;
  }, new Map<string, PopulatedProposal>());

  // A single proposal might trigger multiple workspace events
  // We want to register them as a single event
  // This set keeps track of the proposals encountered
  // Since the events were already sorted in descending order, only the latest one will be processed
  const visitedProposals: Set<string> = new Set();

  // These workspace events should be marked, as a relatively newer event was marked
  const unmarkedWorkspaceEvents: string[] = [];

  for (const workspaceEvent of proposalChangeEvents) {
    const proposal = proposalsMap.get(workspaceEvent.pageId);
    const space = proposal && spaceMap.get(proposal.spaceId);
    if (space && proposal) {
      const {
        meta: { newStatus }
      } = workspaceEvent as WorkspaceEventSpecialWithMeta;
      const processedAlready = visitedProposals.has(proposal.id);

      // ignore draft events
      if (newStatus.match(/draft/) || proposal.page.deletedAt || processedAlready) {
        unmarkedWorkspaceEvents.push(workspaceEvent.id);
      } else {
        visitedProposals.add(proposal.id);
        const isAuthor = proposal.authors.some((author) => author.userId === userId);
        const isReviewer = proposal.reviewers.some((reviewer) =>
          reviewer.roleId ? roleIds.includes(reviewer.roleId) : reviewer.userId === userId
        );
        // Check notifications are enabled for space-wide proposal notifications
        const notifyNewEvents = Boolean(
          space.notifyNewProposals && space.notifyNewProposals < workspaceEvent.createdAt
        );
        const action = getProposalAction({
          currentStatus: proposal.status,
          isAuthor,
          isReviewer,
          notifyNewEvents
        });
        if (!action) {
          unmarkedWorkspaceEvents.push(workspaceEvent.id);
          // eslint-disable-next-line no-continue
          continue;
        }

        // check category permissions
        const category = proposal.categoryId && categoryMap.get(proposal.categoryId);
        if (
          category &&
          ((action === 'start_discussion' && !category.permissions.comment_proposals) ||
            (action === 'vote' && !category.permissions.vote_proposals))
        ) {
          // Do nothing
          unmarkedWorkspaceEvents.push(workspaceEvent.id);
          // eslint-disable-next-line no-continue
          continue;
        }

        const proposalTask: ProposalNotification = {
          type: action,
          taskId: workspaceEvent.id,
          pagePath: proposal.page.path,
          pageTitle: proposal.page.title,
          spaceDomain: space.domain,
          spaceName: space.name,
          status: proposal.status,
          pageId: proposal.page.id,
          createdBy: workspaceEvent.actor
            ? mapNotificationActor(workspaceEvent.actor) ?? proposal.authors[0].author
            : proposal.authors[0].author,
          createdAt: workspaceEvent.createdAt.toISOString(),
          commentId: null,
          inlineCommentId: null,
          mentionId: null,
          spaceId: workspaceEvent.spaceId,
          archived: false,
          read: false,
          group: 'proposal'
        };

        proposalTasks.push(proposalTask);
      }
    }
  }

  return {
    proposalTasks,
    unmarkedWorkspaceEvents
  };
}
