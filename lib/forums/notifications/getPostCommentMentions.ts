import { prisma } from 'db';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { ForumNotificationsInput, ForumNotifications } from './getForumNotifications';
import { getPropertiesFromPost } from './utils';

export async function getPostCommentMentions({
  userId,
  username,
  spaceRecord,
  spaceIds
}: ForumNotificationsInput): Promise<ForumNotifications> {
  const comments = await prisma.postComment.findMany({
    where: {
      post: {
        spaceId: {
          in: spaceIds
        }
      },
      deletedAt: null
    },
    select: {
      id: true,
      createdBy: true,
      content: true,
      post: {
        select: {
          title: true,
          id: true,
          path: true,
          spaceId: true
        }
      }
    }
  });

  const mentions: ForumNotifications['mentions'] = [];
  const discussionUserIds: string[] = [];

  for (const comment of comments) {
    const content = comment.content as PageContent;
    if (content) {
      const extractedMentions = extractMentions(content, username);
      extractedMentions.forEach((mention) => {
        if (mention.value === userId && mention.createdBy !== userId && comment.createdBy !== userId) {
          discussionUserIds.push(mention.createdBy);
          mentions.push({
            ...getPropertiesFromPost(comment.post, spaceRecord),
            mentionId: mention.id,
            createdAt: mention.createdAt,
            userId: mention.createdBy,
            commentText: mention.text,
            commentId: null,
            postId: comment.post.id,
            postPath: comment.post.path,
            postTitle: comment.post.title
          });
        }
      });
    }
  }
  return {
    comments: [],
    mentions,
    discussionUserIds
  };
}
