import { prisma } from 'db';

import { PostNotFoundError } from './errors';

type PostVote = {
  postId: string;
  userId: string;
  upvoted: boolean | null;
};

export async function voteForumPost({ upvoted, userId, postId }: PostVote) {
  const post = await prisma.post.findUnique({
    where: {
      id: postId
    },
    select: {
      id: true
    }
  });

  if (!post) {
    throw new PostNotFoundError(postId);
  }

  if (upvoted === null) {
    await prisma.postUpDownVote.delete({
      where: {
        createdBy_postId: {
          createdBy: userId,
          postId
        }
      }
    });
  } else {
    await prisma.postUpDownVote.upsert({
      create: {
        createdBy: userId,
        upvoted,
        postId
      },
      update: {
        upvoted
      },
      where: {
        createdBy_postId: {
          createdBy: userId,
          postId
        }
      }
    });
  }
}
