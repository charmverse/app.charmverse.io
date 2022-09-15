import { Page, ProposalStatus, Space, WorkspaceEvent } from '@prisma/client';
import { prisma } from 'db';
import { ProposalWithUsers } from './interface';

export type ProposalTask = {
  id: string
  action: 'discuss' |
    'start_discussion' |
    'review' |
    'start_vote' |
    'vote' |
    'start_review'
  pageTitle: string
  spaceName: string
  spaceDomain: string
  pagePath: string
}

export async function getProposalTasksFromWorkspaceEvents (userId: string, workspaceEvents: WorkspaceEvent[]) {
  const proposalTasks: ProposalTask[] = [];

  // Sort the events in descending order based on their created date to help in de-duping
  workspaceEvents.sort((we1, we2) => we1.createdAt > we2.createdAt ? -1 : 1);

  const proposals = await prisma.proposal.findMany({
    where: {
      id: {
        in: workspaceEvents.map(workspaceEvent => workspaceEvent.pageId)
      }
    },
    include: {
      authors: true,
      reviewers: true,
      space: true,
      page: true
    }
  });

  // Get all the spaceRole and role this user has been assigned to
  // Roles would be used to detect if the user is a reviewer of the proposal
  // SpaceRoles would be used to detect if the user is a contributor of the proposal space
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
  const roleIds = spaceRoles.map(spaceRole => spaceRole.spaceRoleToRole[0].role.id);

  const proposalsRecord: Record<string, ProposalWithUsers & {
    space: Space
    page: Page | null
  }> = {};

  proposals.forEach(proposal => {
    proposalsRecord[proposal.id] = proposal;
  });

  // A single proposal might trigger multiple workspace events
  // We want to register them as a single event
  // This set keeps track of the proposals encountered
  // Since the events were already sorted in descending order, only the latest one will be processed
  const visitedProposals: Set<string> = new Set();

  for (const workspaceEvent of workspaceEvents) {
    const proposal = proposalsRecord[workspaceEvent.pageId];

    // If an even for this proposal was already handled no need to process further
    if (!visitedProposals.has(proposal.id)) {
      const { newStatus } = workspaceEvent.meta as {
        newStatus: ProposalStatus
        oldStatus: ProposalStatus
      };

      const isAuthor = proposal.authors.find(author => author.userId === userId);
      const isContributor = spaceIds.includes(workspaceEvent.spaceId);
      const isReviewer = proposal.reviewers.find(reviewer => {
        if (reviewer.userId) {
          return reviewer.userId === userId;
        }
        return roleIds.includes(reviewer.roleId as string);
      });

      const proposalTask: Omit<ProposalTask, 'action'> = {
        id: workspaceEvent.id,
        pagePath: (proposal.page as Page).path,
        pageTitle: (proposal.page as Page).title,
        spaceDomain: proposal.space.domain,
        spaceName: proposal.space.name
      };

      if (isAuthor) {
        if (newStatus === 'draft' || newStatus === 'private_draft') {
          proposalTasks.push({
            ...proposalTask,
            action: 'start_discussion'
          });
        }
        else if (newStatus === 'reviewed') {
          proposalTasks.push({
            ...proposalTask,
            action: 'start_vote'
          });
        }
        else if (newStatus === 'discussion') {
          proposalTasks.push({
            ...proposalTask,
            action: 'start_review'
          });
        }
      }
      else if (isContributor) {
        if (newStatus === 'discussion') {
          proposalTasks.push({
            ...proposalTask,
            action: 'discuss'
          });
        }
        else if (newStatus === 'vote_active') {
          proposalTasks.push({
            ...proposalTask,
            action: 'vote'
          });
        }
      }
      else if (isReviewer && newStatus === 'review') {
        proposalTasks.push({
          ...proposalTask,
          action: 'review'
        });
      }
      visitedProposals.add(proposal.id);
    }
  }

  return proposalTasks;
}
