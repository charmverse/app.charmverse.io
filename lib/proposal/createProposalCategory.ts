import type { Prisma } from '@prisma/client';

import { prisma } from 'db';
import { assignDefaultProposalCategoryPermissions } from 'lib/permissions/proposals/assignDefaultProposalCategoryPermission';
import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';

import type { ProposalCategory } from './interface';

export type CreateProposalCategoryInput = Pick<ProposalCategory, 'title' | 'spaceId'> &
  Partial<Pick<ProposalCategory, 'color'>>;

export function createProposalCategory({
  data,
  tx
}: {
  data: CreateProposalCategoryInput;
  tx?: Prisma.TransactionClient;
}): Promise<ProposalCategory> {
  if (tx) {
    return txHandler(tx);
  }

  return prisma.$transaction(txHandler);

  async function txHandler(_tx: Prisma.TransactionClient) {
    const category = await _tx.proposalCategory.create({
      data: {
        color: data.color ?? getRandomThemeColor(),
        title: data.title,
        space: { connect: { id: data.spaceId } }
      }
    });

    await assignDefaultProposalCategoryPermissions({
      proposalCategoryId: category.id,
      tx: _tx
    });

    return category;
  }
}
