import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { addComment } from 'lib/comments/addComment';
import { createPostComment } from 'lib/forums/comments/createPostComment';
import { createForumPost } from 'lib/forums/posts/createForumPost';
import { createNotificationsFromEvent } from 'lib/notifications/createNotificationsFromEvent';
import { createPageComment } from 'lib/pages/comments/createPageComment';
import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';
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
    const user3 = await generateUser();

    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    await addUserToSpace({
      spaceId: space.id,
      userId: user3.id
    });

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

    const user2Mention: UserMentionMetadata = {
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      id: v4(),
      value: user2.id,
      type: 'user'
    };
    const user3Mention: UserMentionMetadata = {
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      id: v4(),
      value: user3.id,
      type: 'user'
    };
    const everyoneMention: UserMentionMetadata = {
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      id: v4(),
      value: 'everyone',
      type: 'role'
    };
    const roleMention: UserMentionMetadata = {
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      id: v4(),
      value: role.id,
      type: 'role'
    };
    const adminMention: UserMentionMetadata = {
      createdAt: new Date().toISOString(),
      createdBy: user2.id,
      id: v4(),
      value: 'admin',
      type: 'role'
    };

    const createdPage = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      content: builders
        .doc(
          builders.mention(user2Mention),
          builders.mention(user3Mention),
          builders.mention(everyoneMention),
          builders.mention(roleMention),
          builders.mention(adminMention)
        )
        .toJSON(),
      pagePermissions: [
        {
          permissionLevel: 'view',
          roleId: role.id
        }
      ]
    });

    const document = await getDocumentEntity(createdPage.id);
    const spaceEntity = await getSpaceEntity(space.id);

    await Promise.all(
      [user2Mention, user3Mention, everyoneMention, roleMention, adminMention].map(async (mention) =>
        createDocumentNotifications({
          event: {
            scope: WebhookEventNames.DocumentMentionCreated,
            document,
            post: null,
            space: spaceEntity,
            user: await getUserEntity(mention.createdBy),
            mention
          },
          spaceId: space.id,
          createdAt: new Date().toISOString()
        })
      )
    );

    const [user2MentionNotification, user3MentionNotification] = await Promise.all(
      [user2Mention, user3Mention].map((mention) =>
        prisma.documentNotification.findFirst({
          where: {
            type: 'mention.created',
            mentionId: mention.id,
            pageId: createdPage.id,
            notificationMetadata: {
              spaceId: space.id,
              userId: mention.value
            }
          }
        })
      )
    );

    const adminMentionNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'mention.created',
        mentionId: adminMention.id,
        pageId: createdPage.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const [everyoneMentionUserNotification, everyoneMentionUser2Notification, everyoneMentionUser3Notification] =
      await Promise.all(
        [user, user2, user3].map((_user) =>
          prisma.documentNotification.findFirst({
            where: {
              type: 'mention.created',
              mentionId: everyoneMention.id,
              pageId: createdPage.id,
              notificationMetadata: {
                spaceId: space.id,
                userId: _user.id
              }
            }
          })
        )
      );

    const [roleMentionUserNotification, roleMentionUser2Notification, roleMentionUser3Notification] = await Promise.all(
      [user, user2, user3].map((_user) =>
        prisma.documentNotification.findFirst({
          where: {
            type: 'mention.created',
            mentionId: roleMention.id,
            pageId: createdPage.id,
            notificationMetadata: {
              spaceId: space.id,
              userId: _user.id
            }
          }
        })
      )
    );

    expect(user2MentionNotification).toBeTruthy();
    expect(user3MentionNotification).toBeFalsy();
    expect(adminMentionNotification).toBeTruthy();
    expect(everyoneMentionUserNotification).toBeFalsy();
    expect(everyoneMentionUser2Notification).toBeTruthy();
    expect(everyoneMentionUser3Notification).toBeFalsy();
    expect(roleMentionUserNotification).toBeFalsy();
    expect(roleMentionUser2Notification).toBeTruthy();
    expect(roleMentionUser3Notification).toBeFalsy();
  });

  it(`Should create document notifications for mention.created event in a post`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await generateUser();
    const user3 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    await addUserToSpace({
      spaceId: space.id,
      userId: user3.id
    });

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

    const user2Mention: UserMentionMetadata = {
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      id: v4(),
      value: user2.id,
      type: 'user'
    };

    const user3Mention: UserMentionMetadata = {
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      id: v4(),
      value: user3.id,
      type: 'user'
    };

    const everyoneMention: UserMentionMetadata = {
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      id: v4(),
      value: 'everyone',
      type: 'role'
    };

    const roleMention: UserMentionMetadata = {
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      id: v4(),
      value: role.id,
      type: 'role'
    };

    const adminMention: UserMentionMetadata = {
      createdAt: new Date().toISOString(),
      createdBy: user2.id,
      id: v4(),
      value: 'admin',
      type: 'role'
    };

    const postCategory = await generatePostCategory({ spaceId: space.id });

    const post = await createForumPost({
      categoryId: postCategory.id,
      content: builders
        .doc(
          builders.mention(user2Mention),
          builders.mention(user3Mention),
          builders.mention(everyoneMention),
          builders.mention(roleMention),
          builders.mention(adminMention)
        )
        .toJSON(),
      contentText: 'Hello World',
      createdBy: user.id,
      isDraft: false,
      spaceId: space.id,
      title: 'Hello World'
    });

    await upsertPostCategoryPermission({
      assignee: { group: 'role', id: role.id },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    });

    const postEntity = await getPostEntity(post.id);
    const spaceEntity = await getSpaceEntity(space.id);

    await Promise.all(
      [user2Mention, user3Mention, everyoneMention, roleMention, adminMention].map(async (mention) =>
        createDocumentNotifications({
          event: {
            scope: WebhookEventNames.DocumentMentionCreated,
            document: null,
            post: postEntity,
            space: spaceEntity,
            user: await getUserEntity(mention.createdBy),
            mention
          },
          spaceId: space.id,
          createdAt: new Date().toISOString()
        })
      )
    );

    const [user2MentionNotification, user3MentionNotification] = await Promise.all(
      [user2Mention, user3Mention].map((mention) =>
        prisma.documentNotification.findFirst({
          where: {
            type: 'mention.created',
            mentionId: mention.id,
            postId: post.id,
            notificationMetadata: {
              spaceId: space.id,
              userId: mention.value
            }
          }
        })
      )
    );

    const adminMentionNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'mention.created',
        mentionId: adminMention.id,
        postId: post.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const [everyoneMentionUserNotification, everyoneMentionUser2Notification, everyoneMentionUser3Notification] =
      await Promise.all(
        [user, user2, user3].map((_user) =>
          prisma.documentNotification.findFirst({
            where: {
              type: 'mention.created',
              mentionId: everyoneMention.id,
              postId: post.id,
              notificationMetadata: {
                spaceId: space.id,
                userId: _user.id
              }
            }
          })
        )
      );

    const [roleMentionUserNotification, roleMentionUser2Notification, roleMentionUser3Notification] = await Promise.all(
      [user, user2, user3].map((_user) =>
        prisma.documentNotification.findFirst({
          where: {
            type: 'mention.created',
            mentionId: roleMention.id,
            postId: post.id,
            notificationMetadata: {
              spaceId: space.id,
              userId: _user.id
            }
          }
        })
      )
    );

    expect(user2MentionNotification).toBeTruthy();
    expect(user3MentionNotification).toBeFalsy();
    expect(adminMentionNotification).toBeTruthy();
    expect(everyoneMentionUserNotification).toBeFalsy();
    expect(everyoneMentionUser2Notification).toBeTruthy();
    expect(everyoneMentionUser3Notification).toBeFalsy();
    expect(roleMentionUserNotification).toBeFalsy();
    expect(roleMentionUser2Notification).toBeTruthy();
    expect(roleMentionUser3Notification).toBeFalsy();
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
