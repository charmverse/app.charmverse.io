import { prisma } from 'db';
import type { PageWithProposal } from 'lib/pages';
import { getPagePath } from 'lib/pages';
import { v4 } from 'uuid';

export interface CreateProposalTemplateInput {
  spaceId: string
  userId: string
}

export async function createProposalTemplate ({ spaceId, userId }: CreateProposalTemplateInput): Promise<PageWithProposal> {

  const proposalId = v4();

  return prisma.page.create({
    data: {
      id: proposalId,
      path: getPagePath(),
      contentText: '',
      title: 'Untitled',
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
}
