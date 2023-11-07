import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { addComment } from 'lib/comments/addComment';
import { createPostComment } from 'lib/forums/comments/createPostComment';
import { createForumPost } from 'lib/forums/posts/createForumPost';
import { createNotificationsFromEvent } from 'lib/notifications/createNotificationsFromEvent';
import { createPageComment } from 'lib/pages/comments/createPageComment';
import { createProposal } from 'lib/proposal/createProposal';
import { emptyDocument } from 'lib/prosemirror/constants';
import type { UserMentionMetadata } from 'lib/prosemirror/extractMentions';
import { assignRole } from 'lib/roles';
import { createThread } from 'lib/threads';
import { createUserFromWallet } from 'lib/users/createUser';
import {
  getCommentEntity,
  getDocumentEntity,
  getInlineCommentEntity,
  getPostEntity,
  getSpaceEntity,
  getUserEntity
} from 'lib/webhookPublisher/entities';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { builders } from 'testing/prosemirror/builders';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generatePostCategory } from 'testing/utils/forums';
import { generateProposalCategory } from 'testing/utils/proposals';
import { createRole } from 'testing/utils/roles';
import { addUserToSpace } from 'testing/utils/spaces';
import { generateUser } from 'testing/utils/users';

import { createDocumentNotifications } from '../createDocumentNotifications';

describe(`Test document events and notifications`, () => {
  it(`Should create document notifications for mention.created event in a page`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });
    const mentionId = v4();

    const createdPage = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      content: builders
        .doc(
          builders.mention({
            type: 'user',
            value: user2.id,
            id: mentionId,
            createdAt: new Date().toISOString(),
            createdBy: user.id
          })
        )
        .toJSON()
    });

    await createDocumentNotifications({
      event: {
        scope: WebhookEventNames.DocumentMentionCreated,
        document: await getDocumentEntity(createdPage.id),
        post: null,
        space: await getSpaceEntity(space.id),
        user: await getUserEntity(user.id),
        mention: {
          createdAt: new Date().toISOString(),
          createdBy: user.id,
          id: mentionId,
          value: user2.id,
          parentNode: null,
          type: 'user'
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

  it(`Should create document notifications for mention.created event in a page (mention @admin)`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const user3 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user3.id
    });

    const mentionId = v4();

    const mention: UserMentionMetadata = {
      type: 'role',
      value: 'admin',
      id: mentionId,
      createdAt: new Date().toISOString(),
      createdBy: user2.id
    };

    const createdPage = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      content: builders.doc(builders.mention(mention)).toJSON()
    });

    await createDocumentNotifications({
      event: {
        scope: WebhookEventNames.DocumentMentionCreated,
        document: await getDocumentEntity(createdPage.id),
        post: null,
        space: await getSpaceEntity(space.id),
        user: await getUserEntity(user2.id),
        mention
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const documentUserNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'mention.created',
        mentionId,
        pageId: createdPage.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const documentUser3Notification = await prisma.documentNotification.findFirst({
      where: {
        type: 'mention.created',
        mentionId,
        pageId: createdPage.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user3.id
        }
      }
    });

    expect(documentUserNotification).toBeTruthy();
    expect(documentUser3Notification).toBeFalsy();
  });

  it(`Should create document notifications for mention.created event in a page (mention @everyone)`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const user3 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user3.id
    });

    const mentionId = v4();

    const mention: UserMentionMetadata = {
      type: 'role',
      value: 'everyone',
      id: mentionId,
      createdAt: new Date().toISOString(),
      createdBy: user.id
    };

    const createdPage = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      content: builders.doc(builders.mention(mention)).toJSON()
    });

    await createDocumentNotifications({
      event: {
        scope: WebhookEventNames.DocumentMentionCreated,
        document: await getDocumentEntity(createdPage.id),
        post: null,
        space: await getSpaceEntity(space.id),
        user: await getUserEntity(user.id),
        mention
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const documentUserNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'mention.created',
        mentionId,
        pageId: createdPage.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const documentUser2Notification = await prisma.documentNotification.findFirst({
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

    const documentUser3Notification = await prisma.documentNotification.findFirst({
      where: {
        type: 'mention.created',
        mentionId,
        pageId: createdPage.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user3.id
        }
      }
    });

    expect(documentUserNotification).toBeFalsy();
    expect(documentUser2Notification).toBeTruthy();
    expect(documentUser3Notification).toBeTruthy();
  });

  it(`Should create document notifications for mention.created event in a post`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });
    const mentionId = v4();

    const postCategory = await generatePostCategory({ spaceId: space.id });

    const post = await createForumPost({
      categoryId: postCategory.id,
      content: builders
        .doc(
          builders.mention({
            type: 'user',
            value: user2.id,
            id: mentionId,
            createdAt: new Date().toISOString(),
            createdBy: user.id
          })
        )
        .toJSON(),
      contentText: 'Hello World',
      createdBy: user.id,
      isDraft: false,
      spaceId: space.id,
      title: 'Hello World'
    });

    await createDocumentNotifications({
      event: {
        scope: WebhookEventNames.DocumentMentionCreated,
        post: await getPostEntity(post.id),
        document: null,
        space: await getSpaceEntity(space.id),
        user: await getUserEntity(user.id),
        mention: {
          createdAt: new Date().toISOString(),
          createdBy: user.id,
          id: mentionId,
          value: user2.id,
          parentNode: null,
          type: 'user'
        }
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const documentNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'mention.created',
        mentionId,
        postId: post.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    expect(documentNotification).toBeTruthy();
  });

  it(`Should create document notifications for mention.created event in a post (mention a specific role)`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });
    const mentionId = v4();

    const role = await createRole({
      spaceId: space.id,
      createdBy: user.id
    });

    await assignRole({
      roleId: role.id,
      userId: user.id
    });

    await assignRole({
      roleId: role.id,
      userId: user2.id
    });

    const postCategory = await generatePostCategory({ spaceId: space.id });

    const mention: UserMentionMetadata = {
      type: 'role',
      value: role.id,
      id: mentionId,
      createdAt: new Date().toISOString(),
      createdBy: user.id
    };

    const post = await createForumPost({
      categoryId: postCategory.id,
      content: builders.doc(builders.mention(mention)).toJSON(),
      contentText: 'Hello World',
      createdBy: user.id,
      isDraft: false,
      spaceId: space.id,
      title: 'Hello World'
    });

    await createDocumentNotifications({
      event: {
        scope: WebhookEventNames.DocumentMentionCreated,
        post: await getPostEntity(post.id),
        document: null,
        space: await getSpaceEntity(space.id),
        user: await getUserEntity(user.id),
        mention
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const documentUserNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'mention.created',
        mentionId,
        postId: post.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const documentUser2Notification = await prisma.documentNotification.findFirst({
      where: {
        type: 'mention.created',
        mentionId,
        postId: post.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    expect(documentUserNotification).toBeFalsy();
    expect(documentUser2Notification).toBeTruthy();
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

  it(`Should create document notifications for page.comment.created event`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });

    const { proposal, page } = await createProposal({
      categoryId: proposalCategory.id,
      spaceId: space.id,
      userId: user.id
    });

    const mentionId = v4();

    const proposalComment1 = await createPageComment({
      content: emptyDocument,
      contentText: 'Hello World',
      pageId: page.id,
      userId: user.id
    });

    const proposalComment1Reply = await createPageComment({
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
      },
      contentText: 'Hello World',
      pageId: page.id,
      userId: user2.id,
      parentId: proposalComment1.id
    });

    const proposalComment2 = await createPageComment({
      content: emptyDocument,
      contentText: 'Hello World',
      pageId: page.id,
      userId: user2.id
    });

    const documentEntity = await getDocumentEntity(page.id);
    const spaceEntity = await getSpaceEntity(space.id);

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.DocumentCommentCreated,
        comment: await getCommentEntity(proposalComment1.id),
        document: documentEntity,
        post: null,
        space: spaceEntity
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.DocumentCommentCreated,
        comment: await getCommentEntity(proposalComment1Reply.id),
        space: spaceEntity,
        document: documentEntity,
        post: null
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.DocumentCommentCreated,
        comment: await getCommentEntity(proposalComment2.id),
        space: spaceEntity,
        document: documentEntity,
        post: null
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const proposalCommentCreatedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'comment.created',
        pageId: page.id,
        pageCommentId: proposalComment2.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const proposalCommentRepliedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'comment.replied',
        pageId: page.id,
        pageCommentId: proposalComment1Reply.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const commentMentionCreatedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'comment.mention.created',
        pageId: proposal.id,
        mentionId,
        pageCommentId: proposalComment1Reply.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    expect(proposalCommentCreatedNotification).toBeTruthy();
    expect(proposalCommentRepliedNotification).toBeTruthy();
    expect(commentMentionCreatedNotification).toBeTruthy();
  });

  it(`Should create document notifications for post.comment.created event`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const postCategory = await generatePostCategory({ spaceId: space.id });

    const mentionId = v4();

    const post = await createForumPost({
      categoryId: postCategory.id,
      content: emptyDocument,
      contentText: 'Hello World',
      createdBy: user.id,
      isDraft: false,
      spaceId: space.id,
      title: 'Hello World'
    });

    const postComment1 = await createPostComment({
      content: emptyDocument,
      contentText: 'Hello World',
      postId: post.id,
      userId: user.id
    });

    const postComment1Reply = await createPostComment({
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
      },
      contentText: 'Hello World',
      postId: post.id,
      userId: user2.id,
      parentId: postComment1.id
    });

    const postComment2 = await createPostComment({
      content: emptyDocument,
      contentText: 'Hello World',
      postId: post.id,
      userId: user2.id
    });

    const postEntity = await getPostEntity(post.id);
    const spaceEntity = await getSpaceEntity(space.id);

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.DocumentCommentCreated,
        comment: await getCommentEntity(postComment1.id, true),
        post: postEntity,
        space: spaceEntity,
        document: null
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.DocumentCommentCreated,
        comment: await getCommentEntity(postComment1Reply.id, true),
        post: postEntity,
        space: spaceEntity,
        document: null
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.DocumentCommentCreated,
        comment: await getCommentEntity(postComment2.id, true),
        post: postEntity,
        space: spaceEntity,
        document: null
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const postCommentCreatedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'comment.created',
        postId: post.id,
        postCommentId: postComment2.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const postCommentRepliedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'comment.replied',
        postId: post.id,
        postCommentId: postComment1Reply.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const commentMentionCreatedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'comment.mention.created',
        postId: post.id,
        mentionId,
        postCommentId: postComment1Reply.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    expect(postCommentCreatedNotification).toBeTruthy();
    expect(postCommentRepliedNotification).toBeTruthy();
    expect(commentMentionCreatedNotification).toBeTruthy();
  });
});
