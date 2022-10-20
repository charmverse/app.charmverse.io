import type { ProposalStatus, WorkspaceEvent } from '@prisma/client';

import { prisma } from 'db';

import { getProposalAction } from './getProposalAction';

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

type WorkspaceEventRecord = Record<string, Pick<WorkspaceEvent, 'id' | 'pageId' | 'createdAt' | 'meta'> | null>

function sortProposals (proposals: ProposalTask[]) {
  proposals.sort((proposalA, proposalB) => {
    return proposalA.eventDate > proposalB.eventDate ? -1 : 1;
  });
}

export async function getProposalTasks (userId: string): Promise<{
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

  const spaceIds = spaceRoles.map(spaceRole => spaceRole.spaceId);
  // Get all the roleId assigned to this user for each space
  const roleIds = spaceRoles.map(spaceRole => spaceRole.spaceRoleToRole).flat().map(({ role }) => role.id);

  const pagesWithProposals = await prisma.page.findMany({
    where: {
      deletedAt: null,
      spaceId: {
        in: spaceIds
      },
      type: 'proposal',
      proposal: {
        status: {
          notIn: ['draft', 'private_draft']
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

  const userNotificationIds = new Set(userNotifications.map(userNotification => userNotification.taskId));

  const proposalsRecord: { marked: ProposalTask[], unmarked: ProposalTask[] } = {
    marked: [],
    unmarked: []
  };

  pagesWithProposals.forEach(({ proposal, ...page }) => {
    if (proposal) {
      const workspaceEvent = workspaceEventsRecord[page.id];
      const isReviewer = proposal.reviewers.some(reviewer => reviewer.roleId ? roleIds.includes(reviewer.roleId) : reviewer.userId === userId);
      const isAuthor = proposal.authors.some(author => author.userId === userId);
      const action = getProposalAction(
        {
          currentStatus: proposal.status,
          isAuthor,
          isReviewer
        }
      );

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
        }
        else {
          proposalsRecord.marked.push(proposalTask);
        }
      }
    }
  });

  sortProposals(proposalsRecord.marked);
  sortProposals(proposalsRecord.unmarked);

  return proposalsRecord;
}
