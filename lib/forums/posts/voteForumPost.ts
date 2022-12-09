import { PageNotFoundError } from 'next/dist/shared/lib/utils';

import { prisma } from 'db';

import { getForumPost } from './getForumPost';

export async function voteForumPost({
  upvoted,
  userId,
  pageId
}: {
  pageId: string;
  userId: string;
  upvoted?: boolean;
}) {
  const page = await getForumPost(pageId);

  if (!page || !page.post) {
    throw new PageNotFoundError(pageId);
  }

  if (upvoted === undefined) {
    await prisma.pageUpDownVote.delete({
      where: {
        createdBy_pageId: {
          createdBy: userId,
          pageId
        }
      }
    });
  } else {
    await prisma.pageUpDownVote.upsert({
      create: {
        createdBy: userId,
        upvoted,
        pageId
      },
      update: {
        upvoted
      },
      where: {
        createdBy_pageId: {
          createdBy: userId,
          pageId
        }
      }
    });
  }
}
