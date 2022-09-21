import type { Prisma } from '@prisma/client';
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
  const pageData: Prisma.PageCreateInput = { ...pageCreateInput, id: proposalId };
  // Using a transaction to ensure both the proposal and page gets created together
  const createdPage = await prisma.page.create({
    data: {
      ...pageData,
      type: 'proposal',
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

  return createdPage;
}
