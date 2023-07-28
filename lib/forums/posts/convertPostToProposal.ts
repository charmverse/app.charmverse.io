import type { Post, Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { createProposal } from 'lib/proposal/createProposal';

export async function convertPostToProposal({
  userId,
  post,
  content,
  categoryId
}: {
  post: Pick<Post, 'spaceId' | 'title' | 'id'>;
  content?: Prisma.JsonValue;
  userId: string;
  categoryId: string;
}) {
  const { page: proposalPage } = await createProposal({
    userId,
    spaceId: post.spaceId,
    pageProps: {
      content: content ?? undefined,
      title: post.title
    },
    categoryId
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
