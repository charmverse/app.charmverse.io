import { prisma } from '@charmverse/core/prisma-client';

import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { ForumNotificationsContext, ForumNotifications } from './getForumTasks';
import { getPropertiesFromPost } from './utils';

export async function getPostMentions({
  userId,
  username,
  spacesRecord,
  posts
}: ForumNotificationsContext): Promise<ForumNotifications> {
  const mentions: ForumNotifications['mentions'] = [];

  for (const post of posts) {
    const content = post.content as PageContent;
    if (content) {
      const extractedMentions = extractMentions(content, username);
      for (const mention of extractedMentions) {
        // Skip mentions not for the user, self mentions and inside user created pages
        if (mention.value === userId && mention.createdBy !== userId) {
          const createdBy = await prisma.user.findUnique({
            where: {
              id: mention.createdBy
            },
            select: {
              id: true,
              username: true,
              path: true,
              avatar: true,
              avatarTokenId: true,
              avatarContract: true,
              avatarChain: true,
              deletedAt: true
            }
          });
          if (createdBy) {
            mentions.push({
              createdBy,
              spaceDomain: spacesRecord[post.spaceId].domain,
              spaceName: spacesRecord[post.spaceId].name,
              spaceId: post.spaceId,
              mentionId: mention.id,
              createdAt: mention.createdAt,
              commentText: mention.text,
              commentId: null,
              postId: post.id,
              postPath: post.path,
              postTitle: post.title,
              taskId: mention.id,
              type: 'mention.created'
            });
          }
        }
      }
    }
  }

  return {
    comments: [],
    mentions
  };
}
