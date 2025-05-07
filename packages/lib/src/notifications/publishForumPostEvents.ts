import { extractMentions } from 'lib/prosemirror/extractMentions';
import { extractPollIds } from 'lib/prosemirror/extractPollIds';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';
import { publishPostEvent, publishDocumentEvent, publishVoteEvent } from '@packages/lib/webhookPublisher/publishEvent';

export async function publishForumPostEvents(post: {
  id: string;
  spaceId: string;
  content: PageContent;
  createdBy: string;
}) {
  await publishPostEvent({
    scope: WebhookEventNames.ForumPostCreated,
    postId: post.id,
    spaceId: post.spaceId
  });

  const extractedMentions = extractMentions(post.content as PageContent);
  const pollIds = extractPollIds(post.content as PageContent);

  for (const userMention of extractedMentions) {
    await publishDocumentEvent({
      scope: WebhookEventNames.DocumentMentionCreated,
      postId: post.id,
      mention: userMention,
      spaceId: post.spaceId,
      userId: userMention.createdBy
    });
  }

  for (const pollId of pollIds) {
    await publishVoteEvent({
      scope: WebhookEventNames.VoteCreated,
      spaceId: post.spaceId,
      voteId: pollId
    });
  }
}
