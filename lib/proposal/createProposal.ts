import { Prisma } from '@prisma/client';
import { prisma } from 'db';
import { v4 } from 'uuid';

export async function createProposal ({
  pageCreateInput,
  userId,
  spaceId
}: {
  pageCreateInput: Prisma.PageCreateInput
  spaceId: string
  userId: string
}) {
  const proposalId = v4();
  // Making the page id same as proposalId
  const pageData: Prisma.PageCreateInput = { ...pageCreateInput, proposalId, id: proposalId };
  // Using a transaction to ensure both the proposal and page gets created together
  const [createdPage] = await prisma.$transaction([
    prisma.page.create({ data: pageData }),
    prisma.proposal.create({
      data: {
        createdBy: userId,
        id: proposalId,
        spaceId,
        status: 'draft',
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
    })
  ]);

  return createdPage;
}
