import { prisma } from '@charmverse/core/prisma-client';

import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { ForumNotificationsContext, ForumNotifications } from './getForumTasks';

export async function getPostCommentMentions({
  userId,
  username,
  posts,
  spacesRecord
}: ForumNotificationsContext): Promise<ForumNotifications> {
  const mentions: ForumNotifications['mentions'] = [];

  for (const post of posts) {
    for (const comment of post.comments) {
      const content = comment.content as PageContent;
      if (content) {
        const extractedMentions = extractMentions(content, username);

        for (const mention of extractedMentions) {
          if (mention.value === userId && mention.createdBy !== userId && comment.createdBy !== userId) {
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
                spaceDomain: spacesRecord[post.spaceId].domain,
                spaceId: post.spaceId,
                spaceName: spacesRecord[post.spaceId].name,
                mentionId: mention.id,
                createdAt: mention.createdAt,
                createdBy,
                commentText: mention.text,
                commentId: comment.id,
                postId: post.id,
                postPath: post.path,
                postTitle: post.title,
                taskId: mention.id,
                type: 'comment.mention.created'
              });
            }
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
