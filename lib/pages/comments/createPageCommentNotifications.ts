import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishPageEvent } from 'lib/webhookPublisher/publishEvent';

export async function createPageCommentNotifications({
  content,
  commentId,
  pageId,
  spaceId,
  userId,
  parentId,
  pageAuthor,
  inline = false
}: {
  parentId?: string;
  spaceId: string;
  commentId: string;
  userId: string;
  pageId: string;
  content: PageContent | null;
  pageAuthor: string;
  inline?: boolean;
}) {
  const extractedMentions = content ? extractMentions(content) : [];

  if (extractedMentions.length) {
    await Promise.all(
      extractedMentions.map((mention) =>
        publishPageEvent({
          pageId,
          scope: inline
            ? WebhookEventNames.PageInlineCommentMentionCreated
            : WebhookEventNames.PageCommentMentionCreated,
          spaceId,
          userId,
          mention,
          commentId
        })
      )
    );
  }

  if (!parentId && pageAuthor !== userId) {
    await publishPageEvent({
      pageId,
      scope: inline ? WebhookEventNames.PageInlineCommentCreated : WebhookEventNames.PageCommentCreated,
      spaceId,
      userId,
      mention: null,
      commentId
    });
  } else if (parentId) {
    await publishPageEvent({
      pageId,
      scope: inline ? WebhookEventNames.PageInlineCommentReplied : WebhookEventNames.PageCommentReplied,
      spaceId,
      userId,
      mention: null,
      commentId
    });
  }
}
