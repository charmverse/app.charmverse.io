import type { Post, Prisma } from '@prisma/client';

import { prisma } from 'db';
import { createProposal } from 'lib/proposal/createProposal';

export async function convertPostToProposal({
  userId,
  post,
  content
}: {
  post: Pick<Post, 'spaceId' | 'title' | 'id'>;
  content?: Prisma.JsonValue;
  userId: string;
}) {
  const { page: proposalPage } = await createProposal({
    createdBy: userId,
    spaceId: post.spaceId,
    content: content ?? undefined,
    title: post.title
  });

  await prisma.post.update({
    where: {
      id: post.id
    },
    data: {
      proposalId: proposalPage.id
    }
  });

  return proposalPage;
}
