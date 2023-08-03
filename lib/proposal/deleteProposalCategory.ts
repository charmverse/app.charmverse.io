import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { InvalidInputError, UndesirableOperationError } from 'lib/utilities/errors';

export async function deleteProposalCategory(categoryId: string) {
  if (!stringUtils.isUUID(categoryId)) {
    throw new InvalidInputError(`Valid category ID is required`);
  }

  // Search for any non deleted proposals to block deletion
  const nonDeletedProposal = await prisma.proposal.findFirst({
    where: {
      categoryId,
      page: {
        deletedAt: null
      }
    },
    select: {
      id: true,
      category: {
        select: {
          title: true
        }
      }
    }
  });

  if (nonDeletedProposal) {
    throw new UndesirableOperationError(
      `${nonDeletedProposal.category?.title} proposal category  cannot be deleted as it contains proposals.`
    );
  }

  // Remove all proposals marked as deleted
  const proposals = await prisma.proposal.findMany({
    where: {
      categoryId
    },
    select: {
      page: {
        select: {
          id: true
        }
      }
    }
  });

  await prisma.$transaction([
    prisma.proposal.deleteMany({
      where: {
        categoryId
      }
    }),
    prisma.page.deleteMany({
      where: {
        id: {
          in: proposals.map((p) => p.page?.id).filter((value) => !!value) as string[]
        }
      }
    }),
    prisma.proposalCategory.delete({
      where: {
        id: categoryId
      }
    })
  ]);
}
