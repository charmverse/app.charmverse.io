import type { Post, Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

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
    userId,
    spaceId: post.spaceId,
    authors: [userId],
    evaluations: [],
    pageProps: {
      content: content ?? undefined,
      title: post.title
    }
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
