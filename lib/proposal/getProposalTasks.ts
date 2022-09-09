import { Page, Proposal, Space } from '@prisma/client';
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

export async function getProposalTasks (userId: string): Promise<ProposalTask[]> {
  const moveToDiscussionProposals = await prisma.proposal.findMany({
    where: {
      status: {
        in: ['draft', 'private_draft']
      },
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

  const startVoteProposals = await prisma.proposal.findMany({
    where: {
      status: 'reviewed',
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

  const toReviewProposals = await prisma.proposal.findMany({
    where: {
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
    include: {
      page: true,
      space: true
    }
  });

  const toDiscussProposals = await prisma.proposal.findMany({
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

  const toVoteProposals = await prisma.proposal.findMany({
    where: {
      status: 'vote_active',
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

  return [
    moveToDiscussionProposals.map(proposal => extractProposalData(proposal, 'move_to_discussion')),
    startVoteProposals.map(proposal => extractProposalData(proposal, 'start_vote')),
    toReviewProposals.map(proposal => extractProposalData(proposal, 'review')),
    toDiscussProposals.map(proposal => extractProposalData(proposal, 'discuss')),
    toVoteProposals.map(proposal => extractProposalData(proposal, 'vote'))
  ].flat();
}
