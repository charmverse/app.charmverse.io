import { prisma } from 'db';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { ForumNotificationsInput, ForumNotifications } from './getForumNotifications';
import { getPropertiesFromPost } from './utils';

export async function getPostMentions({
  userId,
  username,
  spaceIds,
  spaceRecord
}: ForumNotificationsInput): Promise<ForumNotifications> {
  // Get all the pages of all the spaces this user is part of
  const posts = await prisma.post.findMany({
    where: {
      spaceId: {
        in: spaceIds
      },
      deletedAt: null
    },
    select: {
      content: true,
      id: true,
      path: true,
      title: true,
      createdBy: true,
      spaceId: true
    }
  });

  const mentions: ForumNotifications['mentions'] = [];
  const discussionUserIds: string[] = [];

  for (const post of posts) {
    const content = post.content as PageContent;
    if (content) {
      const extractedMentions = extractMentions(content, username);
      extractedMentions.forEach((mention) => {
        // Skip mentions not for the user, self mentions and inside user created pages
        if (mention.value === userId && mention.createdBy !== userId) {
          discussionUserIds.push(mention.createdBy);
          mentions.push({
            ...getPropertiesFromPost(post, spaceRecord),
            mentionId: mention.id,
            createdAt: mention.createdAt,
            userId: mention.createdBy,
            commentText: mention.text,
            commentId: null,
            postId: post.id,
            postPath: post.path,
            postTitle: post.title
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
