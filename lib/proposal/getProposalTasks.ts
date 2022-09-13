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

const StatusActionRecord: Record<Exclude<ProposalStatus, 'vote_closed'>, ProposalTask['action']> = {
  vote_active: 'vote',
  discussion: 'discuss',
  review: 'review',
  reviewed: 'start_vote',
  draft: 'move_to_discussion',
  private_draft: 'move_to_discussion'
};

export async function getProposalTasks (userId: string): Promise<ProposalTask[]> {
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
    orderBy: {
      createdBy: 'desc'
    },
    include: {
      page: true,
      space: true
    }
  });

  return proposalTasks.map(proposal => extractProposalData(proposal, StatusActionRecord[proposal.status as Exclude<ProposalStatus, 'vote_closed'>]));
}
