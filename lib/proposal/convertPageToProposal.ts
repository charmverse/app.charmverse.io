import type { Post, Prisma } from '@prisma/client';

import { prisma } from 'db';
import { createProposal } from 'lib/proposal/createProposal';

export async function convertPageToProposal({
  userId,
  page,
  content
}: {
  page: Pick<Post, 'spaceId' | 'title' | 'id'>;
  content?: Prisma.JsonValue;
  userId: string;
}) {
  const { page: proposalPage } = await createProposal({
    createdBy: userId,
    spaceId: page.spaceId,
    content: content ?? undefined,
    title: page.title
  });

  await prisma.page.update({
    where: {
      id: page.id
    },
    data: {
      convertedProposalId: proposalPage.id
    }
  });

  return proposalPage;
}
