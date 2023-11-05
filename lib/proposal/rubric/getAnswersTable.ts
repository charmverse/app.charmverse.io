import type { PrismaClient } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export function getAnswersTable({ isDraft }: { isDraft?: boolean }) {
  const table = (
    isDraft ? prisma.draftProposalRubricCriteriaAnswer : prisma.proposalRubricCriteriaAnswer
  ) as PrismaClient['proposalRubricCriteriaAnswer'];
  return table;
}
