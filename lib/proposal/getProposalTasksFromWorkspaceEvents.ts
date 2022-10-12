import type { Page, ProposalStatus, Space, WorkspaceEvent } from '@prisma/client';

import { prisma } from 'db';

import type { ProposalWithUsers } from './interface';

export interface ProposalTask {
  id: string;
  action: 'start_discussion' | 'start_vote' | 'review' | 'discuss' | 'vote' | 'start_review';
  spaceDomain: string;
  spaceName: string;
  pageTitle: string;
  pagePath: string;
  status: ProposalStatus;
  pageId: string;
}

type PopulatedPage = Pick<Page, 'id' | 'path' | 'title'> & {
  space: Pick<Space, 'domain' | 'name'>;
  proposal: ProposalWithUsers | null;
};

type ProposalRecord = Record<string, PopulatedPage | undefined>;

type ProposalStatusChangeMetaData = {
  newStatus: ProposalStatus;
  oldStatus?: ProposalStatus; // by convention, an undefined oldStatus means the proposal was just created
}

type ProposalStatusChangeWorkspaceEvent = WorkspaceEvent & { type: 'proposal_status_change' } & { meta: ProposalStatusChangeMetaData };

export async function getProposalTasksFromWorkspaceEvents (userId: string, workspaceEvents: WorkspaceEvent[]) {
  const proposalTasks: ProposalTask[] = [];

  // Sort the events in descending order based on their created date to help in de-duping
  workspaceEvents.sort((we1, we2) => we1.createdAt > we2.createdAt ? -1 : 1);

  const proposalPages = await prisma.page.findMany({
    where: {
      id: {
        in: workspaceEvents.map(workspaceEvent => workspaceEvent.pageId)
      },
      proposal: {
        status: {
          notIn: ['draft', 'private_draft']
        }
      }
    },
    include: {
      space: {
        select: {
          domain: true,
          name: true
        }
      },
      proposal: {
        include: {
          authors: true,
          reviewers: true,
          category: true
        }
      }
    }
  });

  // Get all the spaceRole and role this user has been assigned to
  // Roles would be used to detect if the user is a reviewer of the proposal
  // SpaceRoles would be used to detect if the user is a member of the proposal space
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
    : null).filter(roleId => roleId);

  const proposalsRecord: ProposalRecord = proposalPages.reduce<ProposalRecord>((record, proposal) => {
    record[proposal.id] = proposal;
    return record;
  }, {});

  // A single proposal might trigger multiple workspace events
  // We want to register them as a single event
  // This set keeps track of the proposals encountered
  // Since the events were already sorted in descending order, only the latest one will be processed
  const visitedProposals: Set<string> = new Set();
  // These workspace events should be marked, as a relatively newer event was marked
  const unmarkedWorkspaceEvents: string[] = [];

  for (const workspaceEvent of workspaceEvents) {
    const page = proposalsRecord[workspaceEvent.pageId];
    const { meta: { newStatus } } = workspaceEvent as ProposalStatusChangeWorkspaceEvent;

    if (page?.proposal && !newStatus.match(/draft/)) {
      // If an event for this proposal was already handled no need to process further
      if (!visitedProposals.has(page.id)) {
        const isAuthor = Boolean(page.proposal.authors.find(author => author.userId === userId));
        const isMember = spaceIds.includes(workspaceEvent.spaceId);
        const isReviewer = Boolean(page.proposal.reviewers.find(reviewer => {
          if (reviewer.userId) {
            return reviewer.userId === userId;
          }
          return roleIds.includes(reviewer.roleId as string);
        }));

        const proposalTask: Omit<ProposalTask, 'action'> = {
          id: workspaceEvent.id,
          pagePath: page.path,
          pageTitle: page.title,
          spaceDomain: page.space.domain,
          spaceName: page.space.name,
          status: page.proposal.status,
          pageId: page.id
        };

        if (newStatus === 'discussion') {
          if (isAuthor) {
            proposalTasks.push({
              ...proposalTask,
              action: 'start_review'
            });
          }
          else if (isMember) {
            proposalTasks.push({
              ...proposalTask,
              action: 'discuss'
            });
          }
        }
        else if (newStatus === 'reviewed') {
          if (isAuthor) {
            proposalTasks.push({
              ...proposalTask,
              action: 'start_vote'
            });
          }
        }
        else if (newStatus === 'vote_active') {
          if (isMember) {
            proposalTasks.push({
              ...proposalTask,
              action: 'vote'
            });
          }
        }
        else if (newStatus === 'review') {
          if (isReviewer) {
            proposalTasks.push({
              ...proposalTask,
              action: 'review'
            });
          }
        }

        visitedProposals.add(page.id);
      }
      else {
        unmarkedWorkspaceEvents.push(workspaceEvent.id);
      }
    }
  }

  return {
    proposalTasks,
    unmarkedWorkspaceEvents
  };
}
