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

import { mapNotificationActor } from 'lib/notifications/mapNotificationActor';
import type { NotificationActor } from 'lib/notifications/mapNotificationActor';
import { getPermissionsClient } from 'lib/permissions/api';

import type { ProposalTaskAction } from './getProposalAction';
import { getProposalAction } from './getProposalAction';

export type ProposalTask = {
  id: string; // the id of the workspace event
  spaceDomain: string;
  spaceName: string;
  pageTitle: string;
  pagePath: string;
  status: ProposalStatus;
  pageId: string;

  taskId: string;
  action: ProposalTaskAction | null;
  eventDate: Date;
  createdAt: Date;
  createdBy: NotificationActor | null;
};

type PopulatedProposal = Proposal & {
  authors: ProposalAuthor[];
  reviewers: ProposalReviewer[];
  page: Pick<Page, 'id' | 'path' | 'title'>;
};

type ProposalStatusChangeMetaData = {
  newStatus: ProposalStatus;
  oldStatus?: ProposalStatus; // by convention, an undefined oldStatus means the proposal was just created
};

// For a user with a large amount of space memberships, don't fire off hundreds of request simultaneously
const spacesHandledPerSecond = 10;

const spaceFetcherRateLimit = RateLimit(spacesHandledPerSecond);

type WorkspaceEventSpecial = Pick<WorkspaceEvent, 'createdAt' | 'pageId' | 'id'> & {
  actor?: User | null;
  meta: any;
};

type WorkspaceEventSpecialWithMeta = WorkspaceEventSpecial & {
  meta: ProposalStatusChangeMetaData;
};

export async function getProposalStatusChangeTasks(userId: string, proposalChangeEvents: WorkspaceEventSpecial[]) {
  const proposalTasks: ProposalTask[] = [];

  // Sort the events in descending order based on their created date to help in de-duping
  proposalChangeEvents.sort((we1, we2) => (we1.createdAt > we2.createdAt ? -1 : 1));

  // Ensures we only track the latest status change for each proposal
  const workspaceEventsMap = proposalChangeEvents.reduce((map, workspaceEvent) => {
    if (!map.get(workspaceEvent.pageId)) {
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
        in: ['discussion', 'review', 'reviewed', 'vote_active']
      },
      spaceId: {
        in: spaceIds
      },
      page: {
        id: {
          in: [...workspaceEventsMap.keys()]
        },
        deletedAt: null
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
      authors: true,
      reviewers: true,
      page: {
        select: {
          id: true,
          path: true,
          title: true
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

  // These workspace events should be marked, as a relatively newer event was marked
  const unmarkedWorkspaceEvents: string[] = [];

  for (const workspaceEvent of proposalChangeEvents) {
    const proposal = proposalsMap.get(workspaceEvent.pageId);
    const space = proposal && spaceMap.get(proposal.spaceId);
    if (space && proposal) {
      const {
        meta: { newStatus }
      } = workspaceEvent as WorkspaceEventSpecialWithMeta;

      // ignore draft events
      if (newStatus.match(/draft/)) {
        unmarkedWorkspaceEvents.push(workspaceEvent.id);
      } else {
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
          // eslint-disable-next-line no-continue
          continue;
        }

        // check category permissions
        const category = proposal.categoryId && categoryMap.get(proposal.categoryId);
        if (
          category &&
          ((action === 'discuss' && !category.permissions.comment_proposals) ||
            (action === 'vote' && !category.permissions.vote_proposals))
        ) {
          // Do nothing
          // eslint-disable-next-line no-continue
          continue;
        }

        const proposalTask: ProposalTask = {
          action,
          id: workspaceEvent.id,
          pagePath: proposal.page.path,
          pageTitle: proposal.page.title,
          spaceDomain: space.domain,
          spaceName: space.name,
          status: proposal.status,
          pageId: proposal.page.id,
          eventDate: workspaceEvent.createdAt,
          createdBy: workspaceEvent.actor ? mapNotificationActor(workspaceEvent.actor) : null,
          taskId: workspaceEvent.id,
          createdAt: workspaceEvent.createdAt
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
