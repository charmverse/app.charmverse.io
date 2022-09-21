import type { Page, Proposal, ProposalStatus, Space, WorkspaceEvent } from '@prisma/client';
import { prisma } from 'db';
import { isTruthy } from 'lib/utilities/types';
import { getProposalAction } from './getProposalAction';

export interface ProposalTask {
  id: string
  action: 'start_discussion' | 'start_vote' | 'review' | 'discuss' | 'vote' | 'start_review' | null
  spaceDomain: string
  spaceName: string
  pageTitle: string
  pagePath: string
  status: ProposalStatus
}

export function extractProposalData (proposal: Proposal & {
  space: Space,
  page: Page | null
}, action: ProposalTask['action']): ProposalTask | null {
  return proposal.page ? {
    id: proposal.id,
    pagePath: proposal.page.path,
    pageTitle: proposal.page.title,
    spaceDomain: proposal.space.domain,
    spaceName: proposal.space.name,
    status: proposal.status,
    action
  } : null;
}

function sortProposals (proposals: ProposalTask[], workspaceEventsRecord: Record<string, Pick<WorkspaceEvent, 'id' | 'pageId' | 'createdAt' | 'meta'>>) {
  proposals.sort((proposalA, proposalB) => {
    const proposalALastUpdatedDate = workspaceEventsRecord[proposalA.id]?.createdAt;
    const proposalBLastUpdatedDate = workspaceEventsRecord[proposalB.id]?.createdAt;
    if (proposalALastUpdatedDate && proposalBLastUpdatedDate) {
      return proposalALastUpdatedDate > proposalBLastUpdatedDate ? -1 : 1;
    }
    else if (proposalALastUpdatedDate && !proposalBLastUpdatedDate) {
      return -1;
    }
    return 1;
  });
}

export async function getProposalTasks (userId: string): Promise<{
  marked: ProposalTask[],
  unmarked: ProposalTask[]
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
  const workspaceEventsRecord = workspaceEvents.reduce<Record<string, Pick<WorkspaceEvent, 'pageId' | 'createdAt' | 'meta' | 'id'>>>((record, workspaceEvent) => {
    if (!record[workspaceEvent.pageId]) {
      record[workspaceEvent.pageId] = workspaceEvent;
    }
    return record;
  }, {});

  const spaceRoles = (await prisma.spaceRole.findMany({
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
  }));

  const spaceIds = spaceRoles.map(spaceRole => spaceRole.spaceId);
  // Get all the roleId assigned to this user
  const roleIds = spaceRoles.map(spaceRole => spaceRole.spaceRoleToRole.length !== 0
    ? spaceRole.spaceRoleToRole[0].role.id
    : null).filter(isTruthy);

  const proposals = await prisma.proposal.findMany({
    where: {
      spaceId: {
        in: spaceIds
      }
    },
    include: {
      authors: true,
      reviewers: true,
      page: true,
      space: true
    }
  });

  const userNotificationIds = new Set(userNotifications.map(userNotification => userNotification.taskId));

  const proposalsRecord: {marked: ProposalTask[], unmarked: ProposalTask[]} = {
    marked: [],
    unmarked: []
  };

  proposals.forEach(proposal => {
    if (proposal.page) {
      const workspaceEvent = workspaceEventsRecord[proposal.id];
      const action = getProposalAction(
        {
          currentStatus: proposal.status,
          authors: proposal.authors.map(author => author.userId),
          reviewers: proposal.reviewers.map(reviewer => (reviewer.userId || reviewer.roleId) as string),
          userId,
          userRoleIds: roleIds
        }
      );

      const proposalTask = {
        id: workspaceEvent.id,
        pagePath: (proposal.page as Page).path,
        pageTitle: (proposal.page as Page).title,
        spaceDomain: proposal.space.domain,
        spaceName: proposal.space.name,
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
  });

  sortProposals(proposalsRecord.marked, workspaceEventsRecord);
  sortProposals(proposalsRecord.unmarked, workspaceEventsRecord);

  return proposalsRecord;
}
