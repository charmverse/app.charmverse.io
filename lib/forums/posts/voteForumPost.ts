import { prisma } from 'db';
import type { MixpanelEventName } from 'lib/metrics/mixpanel/interfaces';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';

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
      id: true,
      spaceId: true,
      category: true
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
    const userAction: MixpanelEventName = upvoted ? 'upvote_post' : 'downvote_post';
    trackUserAction(userAction, {
      resourceId: post.id,
      spaceId: post.spaceId,
      userId,
      categoryName: post.category.name
    });
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
