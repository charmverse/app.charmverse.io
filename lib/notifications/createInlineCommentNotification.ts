import { prisma } from '@charmverse/core/prisma-client';

import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { WebhookEventBody } from 'lib/webhookPublisher/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import { createBountyNotification, createDocumentNotification, createProposalNotification } from './createNotification';

export async function createInlineCommentNotification(
  data: WebhookEventBody<
    | WebhookEventNames.BountyInlineCommentCreated
    | WebhookEventNames.DocumentInlineCommentCreated
    | WebhookEventNames.ProposalInlineCommentCreated
  >
) {
  const spaceId = data.space.id;
  const inlineCommentId = data.inlineComment.id;
  const inlineCommentAuthorId = data.inlineComment.author.id;
  const inlineComment = await prisma.comment.findFirstOrThrow({
    where: {
      id: inlineCommentId
    },
    select: {
      content: true,
      threadId: true
    }
  });
  const threadId = inlineComment.threadId;
  const inlineCommentContent = inlineComment.content as PageContent;
  const previousInlineComment = await prisma.comment.findFirst({
    where: {
      threadId
    },
    orderBy: {
      createdAt: 'desc'
    },
    skip: 1,
    take: 1,
    select: {
      id: true,
      userId: true
    }
  });

  switch (data.scope) {
    case WebhookEventNames.BountyInlineCommentCreated: {
      const authorId = data.bounty.author.id;
      const bountyId = data.bounty.id;
      if (inlineCommentAuthorId !== authorId) {
        await createBountyNotification({
          type: 'inline_comment.created',
          createdBy: inlineCommentAuthorId,
          inlineCommentId,
          bountyId,
          spaceId,
          userId: authorId
        });
      }

      if (previousInlineComment && previousInlineComment?.id !== inlineCommentId) {
        await createBountyNotification({
          type: 'inline_comment.replied',
          createdBy: inlineCommentAuthorId,
          inlineCommentId,
          bountyId,
          spaceId,
          userId: previousInlineComment.userId
        });
      }

      const extractedMentions = extractMentions(inlineCommentContent);
      for (const extractedMention of extractedMentions) {
        const mentionedUserId = extractedMention.value;
        if (mentionedUserId !== inlineCommentAuthorId) {
          await createBountyNotification({
            type: 'inline_comment.mention.created',
            createdBy: inlineCommentAuthorId,
            inlineCommentId,
            mentionId: extractedMention.id,
            bountyId,
            spaceId,
            userId: mentionedUserId
          });
        }
      }
      break;
    }

    case WebhookEventNames.DocumentInlineCommentCreated: {
      const authorId = data.document.author.id;
      const pageId = data.document.id;
      if (inlineCommentAuthorId !== authorId) {
        await createDocumentNotification({
          type: 'inline_comment.created',
          createdBy: inlineCommentAuthorId,
          inlineCommentId,
          pageId,
          spaceId,
          userId: authorId
        });
      }

      if (previousInlineComment && previousInlineComment?.id !== inlineCommentId) {
        await createDocumentNotification({
          type: 'inline_comment.replied',
          createdBy: inlineCommentAuthorId,
          inlineCommentId,
          pageId,
          spaceId,
          userId: previousInlineComment.userId
        });
      }

      const extractedMentions = extractMentions(inlineCommentContent);
      for (const extractedMention of extractedMentions) {
        const mentionedUserId = extractedMention.value;
        if (mentionedUserId !== inlineCommentAuthorId) {
          await createDocumentNotification({
            type: 'inline_comment.mention.created',
            createdBy: inlineCommentAuthorId,
            inlineCommentId,
            mentionId: extractedMention.id,
            pageId,
            spaceId,
            userId: mentionedUserId
          });
        }
      }
      break;
    }
    case WebhookEventNames.ProposalInlineCommentCreated: {
      const authorIds = data.proposal.authors.map((author) => author.id);
      const proposalId = data.proposal.id;
      for (const authorId of authorIds) {
        if (inlineCommentAuthorId !== authorId) {
          await createProposalNotification({
            type: 'inline_comment.created',
            createdBy: inlineCommentAuthorId,
            inlineCommentId,
            proposalId,
            spaceId,
            userId: authorId
          });
        }
      }

      if (previousInlineComment && previousInlineComment?.id !== inlineCommentId) {
        await createProposalNotification({
          type: 'inline_comment.replied',
          createdBy: inlineCommentAuthorId,
          inlineCommentId,
          proposalId,
          spaceId,
          userId: previousInlineComment.userId
        });
      }

      const extractedMentions = extractMentions(inlineCommentContent);
      for (const extractedMention of extractedMentions) {
        const mentionedUserId = extractedMention.value;
        if (mentionedUserId !== inlineCommentAuthorId) {
          await createProposalNotification({
            type: 'inline_comment.mention.created',
            createdBy: inlineCommentAuthorId,
            inlineCommentId,
            mentionId: extractedMention.id,
            proposalId,
            spaceId,
            userId: mentionedUserId
          });
        }
      }
      break;
    }

    default:
      break;
  }
}
