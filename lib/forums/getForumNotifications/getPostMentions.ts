import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { ForumNotificationsContext, ForumNotifications } from './getForumNotifications';
import { getPropertiesFromPost } from './utils';

export function getPostMentions({
  userId,
  username,
  spacesRecord,
  posts
}: ForumNotificationsContext): ForumNotifications {
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
            ...getPropertiesFromPost(post, spacesRecord[post.spaceId]),
            mentionId: mention.id,
            createdAt: mention.createdAt,
            userId: mention.createdBy,
            commentText: mention.text,
            commentId: null,
            postId: post.id,
            postPath: post.path,
            postTitle: post.title,
            taskId: mention.id,
            taskType: 'post_mention'
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
