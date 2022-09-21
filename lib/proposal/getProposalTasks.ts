import type { Page, Proposal, ProposalStatus, Space, WorkspaceEvent } from '@prisma/client';
import { prisma } from 'db';
import { isTruthy } from 'lib/utilities/types';

export interface ProposalTask {
  id: string
  action: 'start_discussion' | 'start_vote' | 'review' | 'discuss' | 'vote' | 'start_review'
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

const StatusActionRecord: Record<Exclude<ProposalStatus, 'vote_closed' | 'discussion'>, ProposalTask['action']> = {
  vote_active: 'vote',
  review: 'review',
  reviewed: 'start_vote',
  draft: 'start_discussion',
  private_draft: 'start_discussion'
};

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
      meta: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Ensures we only track the latest status change for each proposal
  const workspaceEventsRecord = workspaceEvents.reduce<Record<string, Pick<WorkspaceEvent, 'pageId' | 'createdAt' | 'meta'>>>((record, workspaceEvent) => {
    if (!record[workspaceEvent.pageId]) {
      record[workspaceEvent.pageId] = workspaceEvent;
    }
    return record;
  }, {});

  const proposals = await prisma.proposal.findMany({
    where: {
      page: {
        deletedAt: null
      },
      OR: [
        {
          status: 'discussion',
          authors: {
            some: {
              userId
            }
          }
        },
        {
          status: 'discussion',
          space: {
            spaceRoles: {
              some: {
                userId
              }
            }
          }
        },
        {
          status: 'vote_active',
          space: {
            spaceRoles: {
              some: {
                userId
              }
            }
          },
          // Only fetch vote active proposal tasks if the user haven't casted a vote yet
          page: {
            votes: {
              every: {
                context: 'proposal',
                userVotes: {
                  none: {
                    userId
                  }
                }
              }
            }
          }
        },
        {
          status: 'review',
          reviewers: {
            some: {
              OR: [{
                userId
              }, {
                role: {
                  space: {
                    spaceRoles: {
                      some: {
                        userId
                      }
                    }
                  }
                }
              }]
            }
          }
        },
        {
          status: 'reviewed',
          authors: {
            some: {
              userId
            }
          }
        },
        {
          status: {
            in: ['draft', 'private_draft']
          },
          authors: {
            some: {
              userId
            }
          }
        }
      ]
    },
    include: {
      authors: true,
      page: true,
      space: true
    }
  });

  const userNotificationIds = new Set(userNotifications.map(userNotification => userNotification.taskId));

  const proposalsRecord: {marked: ProposalTask[], unmarked: ProposalTask[]} = {
    marked: [],
    unmarked: []
  };

  proposals.map(proposal => {
    if (proposal.status === 'discussion') {
      return proposal.authors.some(author => author.userId === userId) ? extractProposalData(proposal, 'start_review') : extractProposalData(proposal, 'discuss');
    }
    return extractProposalData(proposal, StatusActionRecord[proposal.status as keyof typeof StatusActionRecord]);
  }).filter(isTruthy).forEach(proposalTask => {
    if (!userNotificationIds.has(`${proposalTask.id}.${proposalTask.status}`)) {
      proposalsRecord.unmarked.push(proposalTask);
    }
    else {
      proposalsRecord.marked.push(proposalTask);
    }
  });

  proposalsRecord.marked = proposalsRecord.marked.sort((proposalA, proposalB) => {
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

  proposalsRecord.unmarked = proposalsRecord.unmarked.sort((proposalA, proposalB) => {
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

  return proposalsRecord;
}
