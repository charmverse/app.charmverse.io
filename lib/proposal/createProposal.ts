import type { Page, ProposalStatus, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { v4 } from 'uuid';
import { DataNotFoundError, InsecureOperationError } from 'lib/utilities/errors';
import { getProposal } from './getProposal';
import { generateSyncProposalPermissions } from './syncProposalPermissions';
import { getPagePath } from '../pages';

interface RequiredInput {
  spaceId: string;
  createdBy: string;
}

type CreateProposalFromPageInput = RequiredInput & Pick<Page, 'createdBy' | 'path' | 'title' | 'contentText' | 'spaceId'>;
export type CreateProposalFromTemplateInput = RequiredInput & { templateId: string };

export type CreateProposalInput = CreateProposalFromTemplateInput | CreateProposalFromPageInput;

export async function createProposal (input: CreateProposalInput) {

  const { createdBy, spaceId } = input;
  const { templateId, ...pageProps } = input as CreateProposalFromTemplateInput;

  const proposalTemplate = templateId ? await getProposal({ proposalId: templateId }) : null;

  if (templateId) {
    if (!proposalTemplate) {
      throw new DataNotFoundError(`Proposal template with id ${templateId} not found`);
    }
    else if (spaceId !== proposalTemplate.spaceId) {
      throw new InsecureOperationError('You cannot copy proposals from a different space');
    }
  }

  // Making the page id same as proposalId
  const proposalId = v4();
  const proposalStatus: ProposalStatus = 'private_draft';
  const pageTitle = proposalTemplate ? `Copy of ${proposalTemplate.title}` : (input as CreateProposalFromPageInput).title;

  // Using a transaction to ensure both the proposal and page gets created together
  const [proposal, page, workspaceEvent] = await prisma.$transaction([
    prisma.proposal.create({
      data: {
        // Add page creator as the proposal's first author
        createdBy,
        id: proposalId,
        spaceId,
        status: proposalStatus,
        authors: {
          create: {
            userId: createdBy
          }
        },
        ...proposalTemplate && {
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
    }),
    prisma.page.create({
      data: {
        ...pageProps,
        proposalId,
        contentText: proposalTemplate?.contentText ?? '',
        content: proposalTemplate?.content as Prisma.InputJsonValue ?? undefined,
        path: getPagePath(),
        updatedBy: createdBy,
        id: proposalId,
        title: pageTitle,
        type: 'proposal'
      }
    }),
    prisma.workspaceEvent.create({
      data: {
        type: 'proposal_status_change',
        meta: {
          newStatus: proposalStatus
        },
        actorId: createdBy,
        pageId: proposalId,
        spaceId
      }
    })
  ]);

  const [deleteArgs, createArgs] = await generateSyncProposalPermissions({ proposalId });

  await prisma.$transaction([
    prisma.pagePermission.deleteMany(deleteArgs),
    ...createArgs.map(args => (
      prisma.pagePermission.create(args)
    ))
  ]);

  return { page, proposal, workspaceEvent };
}
