import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { addComment } from 'lib/comments/addComment';
import { emptyDocument } from 'lib/prosemirror/constants';
import { createThread } from 'lib/threads';
import {
  getDocumentEntity,
  getInlineCommentEntity,
  getSpaceEntity,
  getUserEntity
} from 'lib/webhookPublisher/entities';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { addUserToSpace } from 'testing/utils/spaces';
import { generateUser } from 'testing/utils/users';

import { createDocumentNotifications } from '../createDocumentNotifications';

describe(`Test document events and notifications`, () => {
  it(`Should create document notifications for mention.created event`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const createdPage = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const mentionId = v4();

    await createDocumentNotifications({
      event: {
        scope: WebhookEventNames.DocumentMentionCreated,
        document: await getDocumentEntity(createdPage.id),
        space: await getSpaceEntity(space.id),
        user: await getUserEntity(user.id),
        mention: {
          createdAt: new Date().toISOString(),
          createdBy: user.id,
          id: mentionId,
          text: '',
          value: user2.id
        }
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const documentNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'mention.created',
        mentionId,
        pageId: createdPage.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    expect(documentNotification).toBeTruthy();
  });

  it(`Should create document notifications for inline_comment.created event`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const createdPage = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const thread = await createThread({
      context: 'Hello World',
      pageId: createdPage.id,
      userId: user.id,
      comment: emptyDocument
    });

    const mentionId = v4();

    const inlineComment = await addComment({
      threadId: thread.id,
      userId: user2.id,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { text: 'Hello World ', type: 'text' },
              {
                type: 'mention',
                attrs: {
                  id: mentionId,
                  type: 'user',
                  value: user.id,
                  createdAt: new Date().toISOString(),
                  createdBy: user2.id
                }
              }
            ]
          }
        ]
      }
    });

    await createDocumentNotifications({
      event: {
        scope: WebhookEventNames.DocumentInlineCommentCreated,
        document: await getDocumentEntity(createdPage.id),
        space: await getSpaceEntity(space.id),
        inlineComment: await getInlineCommentEntity(inlineComment.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const inlineComment2 = await addComment({
      threadId: thread.id,
      userId: user2.id,
      content: emptyDocument
    });

    await createDocumentNotifications({
      event: {
        scope: WebhookEventNames.DocumentInlineCommentCreated,
        document: await getDocumentEntity(createdPage.id),
        space: await getSpaceEntity(space.id),
        inlineComment: await getInlineCommentEntity(inlineComment2.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const inlineCommentCreatedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'inline_comment.created',
        inlineCommentId: inlineComment2.id,
        pageId: createdPage.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const inlineCommentRepliedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'inline_comment.replied',
        inlineCommentId: inlineComment.id,
        pageId: createdPage.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const inlineCommentMentionCreatedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'inline_comment.mention.created',
        inlineCommentId: inlineComment.id,
        mentionId,
        pageId: createdPage.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    expect(inlineCommentCreatedNotification).toBeTruthy();
    expect(inlineCommentRepliedNotification).toBeTruthy();
    expect(inlineCommentMentionCreatedNotification).toBeTruthy();
  });
});
