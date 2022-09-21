import type { Page, ProposalStatus } from '@prisma/client';
import { prisma } from 'db';
import { v4 } from 'uuid';

export async function createProposal (input: Pick<Page, 'createdBy' | 'path' | 'title' | 'contentText' | 'spaceId'>) {

  const { createdBy, spaceId } = input;

  // Making the page id same as proposalId
  const proposalId = v4();
  const proposalStatus: ProposalStatus = 'private_draft';

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
        }
      }
    }),
    prisma.page.create({
      data: {
        ...input,
        proposalId,
        updatedBy: createdBy,
        id: proposalId,
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

  return { page, proposal, workspaceEvent };
}
