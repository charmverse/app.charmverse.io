import type { PageWithPermissions } from '@charmverse/core/pages';
import { v4 } from 'uuid';

import type { PageWithProposal } from 'lib/pages';
import { createPage } from 'lib/pages/server/createPage';
import { getPagePath } from 'lib/pages/utils';
import { InvalidInputError } from 'lib/utilities/errors';

import type { ProposalReviewerInput } from '../../proposal/interface';

export interface CreateProposalTemplateInput {
  spaceId: string;
  userId: string;
  pageContent?: {
    title?: string;
    contentText?: string;
    content?: any;
  };
  reviewers?: ProposalReviewerInput[];
  categoryId: string;
}

export async function createProposalTemplate({
  spaceId,
  userId,
  pageContent,
  reviewers,
  categoryId
}: CreateProposalTemplateInput): Promise<PageWithPermissions & PageWithProposal> {
  const proposalId = v4();

  if (!categoryId) {
    throw new InvalidInputError('Proposal category is required');
  }

  return createPage({
    data: {
      id: proposalId,
      path: getPagePath(),
      content: pageContent?.content,
      contentText: pageContent?.contentText ?? '',
      title: pageContent?.title ?? '',
      updatedBy: userId,
      author: {
        connect: {
          id: userId
        }
      },
      space: {
        connect: {
          id: spaceId
        }
      },
      type: 'proposal_template',
      proposal: {
        create: {
          createdBy: userId,
          id: proposalId,
          spaceId,
          status: 'draft',
          categoryId,
          // Add page creator as the proposal's first author
          authors: {
            create: {
              author: {
                connect: {
                  id: userId
                }
              }
            }
          },
          reviewers: {
            createMany: {
              data: (reviewers ?? []).map((r) => {
                return {
                  roleId: r.group === 'role' ? r.id : undefined,
                  userId: r.group === 'user' ? r.id : undefined
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
      },
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });
}
