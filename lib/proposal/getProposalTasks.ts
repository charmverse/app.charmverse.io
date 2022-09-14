import { Page, Proposal, ProposalStatus, Space } from '@prisma/client';
import { prisma } from 'db';

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
  const proposalTasks = await prisma.proposal.findMany({
    where: {
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

  return proposalTasks.map(proposal => {
    if (proposal.status === 'discussion') {
      return proposal.authors.map(author => author.userId === userId) ? extractProposalData(proposal, 'start_review') : extractProposalData(proposal, 'discuss');
    }
    return extractProposalData(proposal, StatusActionRecord[proposal.status as keyof typeof StatusActionRecord]);
  });
}
