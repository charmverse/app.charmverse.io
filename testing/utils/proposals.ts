import type { Page, ProposalCategory, ProposalStatus } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { createPage as createPageDb } from 'lib/pages/server/createPage';
import type { ProposalReviewerInput, ProposalWithUsers } from 'lib/proposal/interface';
import { stringToColor } from 'lib/utilities/strings';

export async function generateProposalCategory({
  spaceId,
  title = `Category-${Math.random()}`
}: {
  spaceId: string;
  title?: string;
}): Promise<Required<ProposalCategory>> {
  return prisma.proposalCategory.create({
    data: {
      title,
      space: { connect: { id: spaceId } },
      color: stringToColor(title)
    }
  });
}
/**
 * Creates a proposal with the linked authors and reviewers
 */
export async function generateProposal({
  categoryId,
  userId,
  spaceId,
  proposalStatus,
  authors,
  reviewers,
  deletedAt = null
}: {
  deletedAt?: Page['deletedAt'];
  categoryId: string;
  userId: string;
  spaceId: string;
  authors: string[];
  reviewers: ProposalReviewerInput[];
  proposalStatus: ProposalStatus;
}): Promise<ProposalWithUsers> {
  const proposalId = v4();

  const result = await createPageDb<{ proposal: ProposalWithUsers }>({
    data: {
      id: proposalId,
      contentText: '',
      path: `path-${v4()}`,
      title: 'Proposal',
      type: 'proposal',
      author: {
        connect: {
          id: userId
        }
      },
      updatedBy: userId,
      space: {
        connect: {
          id: spaceId
        }
      },
      deletedAt,
      proposal: {
        create: {
          category: { connect: { id: categoryId } },
          id: proposalId,
          createdBy: userId,
          status: proposalStatus,
          space: {
            connect: {
              id: spaceId
            }
          },
          authors: {
            createMany: {
              data: authors.map((authorId) => ({ userId: authorId }))
            }
          },
          reviewers: {
            createMany: {
              data: (reviewers ?? []).map((r) => {
                return {
                  userId: r.group === 'user' ? r.id : undefined,
                  roleId: r.group === 'role' ? r.id : undefined
                };
              })
            }
          }
        }
      }
    },
    include: {
      proposal: {
        include: {
          authors: true,
          reviewers: true,
          category: true
        }
      }
    }
  });

  const workspaceEvent = await prisma.workspaceEvent.create({
    data: {
      type: 'proposal_status_change',
      meta: {
        newStatus: proposalStatus
      },
      actorId: userId,
      pageId: proposalId,
      spaceId
    }
  });

  return result.proposal;
}
