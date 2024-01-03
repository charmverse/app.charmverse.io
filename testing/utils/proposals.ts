import type { Page, ProposalStatus } from '@charmverse/core/prisma';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { v4 } from 'uuid';

import { createPage as createPageDb } from 'lib/pages/server/createPage';
import type { ProposalReviewerInput } from 'lib/proposal/interface';

export type ProposalWithUsersAndPageMeta = ProposalWithUsers & { page: Pick<Page, 'title' | 'path'> };

/**
 * Creates a proposal with the linked authors and reviewers
 */
export async function generateProposal({
  userId,
  spaceId,
  proposalStatus = 'draft',
  authors = [],
  reviewers = [],
  deletedAt = null
}: {
  deletedAt?: Page['deletedAt'];
  userId: string;
  spaceId: string;
  authors?: string[];
  reviewers?: ProposalReviewerInput[];
  proposalStatus?: ProposalStatus;
}): Promise<ProposalWithUsersAndPageMeta> {
  const proposalId = v4();

  const result = await createPageDb<{ proposal: ProposalWithUsers; title: string; path: string }>({
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
          id: proposalId,
          createdBy: userId,
          status: proposalStatus,
          space: {
            connect: {
              id: spaceId
            }
          },
          authors: !authors.length
            ? undefined
            : {
                createMany: {
                  data: authors.map((authorId) => ({ userId: authorId }))
                }
              },
          reviewers: !reviewers.length
            ? undefined
            : {
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
          reviewers: true
        }
      }
    }
  });

  return { ...result.proposal, page: { title: result.title, path: result.path } };
}
