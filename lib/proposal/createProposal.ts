import type { Prisma } from '@prisma/client';
import { prisma } from 'db';
import { v4 } from 'uuid';
import { DataNotFoundError, InsecureOperationError } from 'lib/utilities/errors';
import { getProposal } from './getProposal';
import type { IPageWithPermissions, PageWithProposal } from '../pages';
import { getPagePath } from '../pages';

export interface CreateProposalInput {
  pageCreateInput?: Prisma.PageCreateInput
  spaceId: string
  userId: string
  templateId?: string
}

export type CreateProposalFromTemplateInput = Required<Omit<CreateProposalInput, 'pageCreateInput'>>
export type CreateProposalFromPageInput = Required<Omit<CreateProposalInput, 'templateId'>>

export async function createProposal ({
  pageCreateInput,
  userId,
  spaceId
}: CreateProposalFromPageInput): Promise<IPageWithPermissions & PageWithProposal>
export async function createProposal ({
  userId,
  spaceId,
  templateId
}: CreateProposalFromTemplateInput): Promise<IPageWithPermissions & PageWithProposal>
export async function createProposal ({
  pageCreateInput,
  userId,
  spaceId,
  templateId
}: CreateProposalInput): Promise<IPageWithPermissions & PageWithProposal> {
  const proposalId = v4();

  const proposalTemplate = templateId ? await getProposal({ proposalId: templateId }) : null;

  if (templateId && !proposalTemplate) {
    throw new DataNotFoundError(`Proposal template with id ${templateId} not found`);
    // Making the page id same as proposalId
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  else if (templateId && spaceId !== proposalTemplate!.spaceId) {
    throw new InsecureOperationError('You cannot copy proposals from a different space');
  }

  let pageData: Prisma.PageCreateInput;

  if (proposalTemplate) {
    pageData = {
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
      contentText: proposalTemplate.contentText,
      content: proposalTemplate.content as Prisma.InputJsonValue,
      id: proposalId,
      type: 'proposal',
      path: getPagePath(),
      title: `Copy of ${proposalTemplate.title}`,
      proposal: {
        create: {
          id: proposalId,
          space: {
            connect: {
              id: spaceId
            }
          },
          createdBy: userId,
          status: 'private_draft',
          authors: {
            create: {
              userId
            }
          },
          reviewers: {
            createMany: {
              data: (proposalTemplate.proposal?.reviewers ?? []).map(r => {
                return {
                  roleId: r.roleId ? r.roleId : undefined,
                  userId: r.userId ? r.userId : undefined
                };
              })
            }
          }
        }
      }
    };
  }
  else {
    pageData = {
      ...pageCreateInput as Prisma.PageCreateInput,
      id: proposalId,
      proposal: {
        create: {
          id: proposalId,
          createdBy: userId,
          status: 'private_draft',
          space: {
            connect: {
              id: spaceId
            }
          },
          authors: {
            create: {
              userId
            }
          }
        }
      }
    };
  }

  // Using a transaction to ensure both the proposal and page gets created together
  const createdPage = await prisma.page.create({
    data: pageData,
    include: {
      proposal: {
        include: {
          authors: true,
          reviewers: true
        }
      },
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });

  return createdPage;
}
