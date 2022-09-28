import { prisma } from 'db';
import type { IPageWithPermissions, PageWithProposal } from 'lib/pages';
import { getPagePath } from 'lib/pages';
import { v4 } from 'uuid';
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
}

export async function createProposalTemplate ({
  spaceId, userId, pageContent, reviewers
}: CreateProposalTemplateInput): Promise<IPageWithPermissions & PageWithProposal> {

  const proposalId = v4();

  return prisma.page.create({
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
          status: 'private_draft',
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
              data: (reviewers ?? []).map(r => {
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
