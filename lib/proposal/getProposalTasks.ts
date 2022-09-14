import { Page, Proposal, ProposalStatus, Space } from '@prisma/client';
import { prisma } from 'db';
import { ProposalTask } from './interface';

export function extractProposalData (proposal: Proposal & {
  space: Space,
  page: Page | null
}, action: ProposalTask['action']): ProposalTask {
  return {
    id: proposal.id,
    pagePath: proposal.page!.path,
    pageTitle: proposal.page!.title,
    spaceDomain: proposal.space.domain,
    spaceName: proposal.space.name,
    status: proposal.status,
    action
  };
}

const StatusActionRecord: Record<Exclude<ProposalStatus, 'vote_closed' | 'discussion'>, ProposalTask['action']> = {
  vote_active: 'vote',
  review: 'review',
  reviewed: 'start_vote',
  draft: 'start_discussion',
  private_draft: 'start_discussion'
};

export async function getProposalTasks (userId: string): Promise<ProposalTask[]> {
  const startReviewTasks = await prisma.proposal.findMany({
    where: {
      status: 'discussion',
      authors: {
        some: {
          userId
        }
      }
    },
    include: {
      page: true,
      space: true
    }
  });

  const discussionTasks = await prisma.proposal.findMany({
    where: {
      status: 'discussion',
      space: {
        spaceRoles: {
          some: {
            userId
          }
        }
      }
    },
    include: {
      page: true,
      space: true
    }
  });

  const proposalTasks = await prisma.proposal.findMany({
    where: {
      OR: [
        {
          status: 'vote_active',
          space: {
            spaceRoles: {
              some: {
                userId
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
      page: true,
      space: true
    }
  });

  return [
    ...discussionTasks.map(discussionTask => extractProposalData(discussionTask, 'discuss')),
    ...startReviewTasks.map(startReviewTask => extractProposalData(startReviewTask, 'start_review')),
    ...proposalTasks.map(proposal => extractProposalData(proposal, StatusActionRecord[proposal.status as keyof typeof StatusActionRecord]))
  ];
}
