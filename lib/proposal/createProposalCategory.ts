import { prisma } from '@charmverse/core';

import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';

import type { ProposalCategory } from './interface';

export type CreateProposalCategoryInput = Pick<ProposalCategory, 'title' | 'spaceId'> &
  Partial<Pick<ProposalCategory, 'color'>>;

export async function createProposalCategory({
  data
}: {
  data: CreateProposalCategoryInput;
}): Promise<ProposalCategory> {
  const category = await prisma.proposalCategory.create({
    data: {
      color: data.color ?? getRandomThemeColor(),
      title: data.title,
      space: { connect: { id: data.spaceId } }
    }
  });

  return category;
}
