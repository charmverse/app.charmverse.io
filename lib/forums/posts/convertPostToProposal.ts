import type { Prisma } from '@prisma/client';

import { prisma } from 'db';
import { createProposal } from 'lib/proposal/createProposal';

export async function convertPostToProposal({
  userId,
  spaceId,
  content,
  title,
  postId
}: {
  title: string;
  content?: Prisma.JsonValue;
  spaceId: string;
  userId: string;
  postId: string;
}) {
  const { page: proposalPage } = await createProposal({
    createdBy: userId,
    spaceId,
    content: content ?? undefined,
    title
  });

  await prisma.post.update({
    where: {
      id: postId
    },
    data: {
      proposalId: proposalPage.id
    }
  });

  return proposalPage;
}
