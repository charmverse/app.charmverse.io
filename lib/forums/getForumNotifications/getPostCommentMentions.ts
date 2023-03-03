import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { ForumNotificationsContext, ForumNotifications } from './getForumNotifications';
import { getPropertiesFromPost } from './utils';

export function getPostCommentMentions({
  userId,
  username,
  posts,
  spacesRecord
}: ForumNotificationsContext): ForumNotifications {
  const mentions: ForumNotifications['mentions'] = [];
  const discussionUserIds: string[] = [];

  for (const post of posts) {
    for (const comment of post.comments) {
      const content = comment.content as PageContent;
      if (content) {
        const extractedMentions = extractMentions(content, username);
        extractedMentions.forEach((mention) => {
          if (mention.value === userId && mention.createdBy !== userId && comment.createdBy !== userId) {
            discussionUserIds.push(mention.createdBy);
            mentions.push({
              ...getPropertiesFromPost(post, spacesRecord[post.spaceId]),
              mentionId: mention.id,
              createdAt: mention.createdAt,
              userId: mention.createdBy,
              commentText: mention.text,
              commentId: comment.id,
              postId: post.id,
              postPath: post.path,
              postTitle: post.title,
              taskId: mention.id,
              taskType: 'post_comment_mention'
            });
          }
        });
      }
    }
  }
  return {
    comments: [],
    mentions,
    discussionUserIds
  };
}
