import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser, testUtilsBounties } from '@charmverse/core/test';
import { builders as _ } from '@packages/bangleeditor/builders';
import { emptyDocument } from '@packages/charmeditor/constants';
import type { UserMentionMetadata } from '@packages/charmeditor/utils/extractMentions';
import { addComment } from '@packages/lib/comments/addComment';
import { createPostComment } from '@packages/lib/forums/comments/createPostComment';
import { createForumPost } from '@packages/lib/forums/posts/createForumPost';
import { createNotificationsFromEvent } from '@packages/lib/notifications/createNotificationsFromEvent';
import { upsertPostCategoryPermission } from '@packages/lib/permissions/forum/upsertPostCategoryPermission';
import { work } from '@packages/lib/rewards/work';
import { assignRole } from '@packages/lib/roles';
import { createThread } from '@packages/lib/threads';
import {
  getApplicationCommentEntity,
  getCommentEntity,
  getDocumentEntity,
  getInlineCommentEntity,
  getPostEntity,
  getSpaceEntity,
  getUserEntity
} from '@packages/lib/webhookPublisher/entities';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';
import { createPageComment } from '@packages/pages/comments/createPageComment';
import { createPage, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generatePostCategory } from '@packages/testing/utils/forums';
import { createRole } from '@packages/testing/utils/roles';
import { randomETHWalletAddress } from '@packages/utils/blockchain';
import { v4 } from 'uuid';

import { createDocumentNotifications } from '../createDocumentNotifications';

describe(`Test document events and notifications`, () => {
  it(`Should create document notifications for mention.created event in a page`, async () => {
    const { space, user } = await generateUserAndSpace({ isAdmin: true });
    const user2 = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });
    const user3 = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
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
      content: _.doc(
        _.mention(user2Mention),
        _.mention(user3Mention),
        _.mention(everyoneMention),
        _.mention(roleMention),
        _.mention(adminMention)
      ).toJSON(),
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
    const { space, user } = await generateUserAndSpace({ isAdmin: true });
    const user2 = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const user3 = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
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
      content: _.doc(
        _.mention(user2Mention),
        _.mention(user3Mention),
        _.mention(everyoneMention),
        _.mention(roleMention),
        _.mention(adminMention)
      ).toJSON(),
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
    const { space, user } = await generateUserAndSpace({ isAdmin: true });
    const user2 = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const createdPage = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        {
          permissionLevel: 'full_access',
          spaceId: space.id
        }
      ]
    });

    const mentionId = v4();
    const mention2Id = v4();

    const thread = await createThread({
      context: 'Hello World',
      pageId: createdPage.id,
      userId: user.id,
      comment: _.doc(
        _.p('Hello World'),
        _.mention({
          id: mentionId,
          type: 'user',
          value: user2.id,
          createdAt: new Date().toISOString(),
          createdBy: user.id
        })
      ).toJSON()
    });

    const document = await getDocumentEntity(createdPage.id);
    const spaceEntity = await getSpaceEntity(space.id);

    await createDocumentNotifications({
      event: {
        scope: WebhookEventNames.DocumentInlineCommentCreated,
        document,
        space: spaceEntity,
        inlineComment: await getInlineCommentEntity(thread.comments[0].id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const inlineComment = await addComment({
      threadId: thread.id,
      userId: user2.id,
      content: _.doc(
        _.p('Hello World'),
        _.mention({
          id: mention2Id,
          type: 'user',
          value: user.id,
          createdAt: new Date().toISOString(),
          createdBy: user2.id
        })
      ).toJSON()
    });

    await createDocumentNotifications({
      event: {
        scope: WebhookEventNames.DocumentInlineCommentCreated,
        document,
        space: spaceEntity,
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
        document,
        space: spaceEntity,
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

    const inlineCommentMention2CreatedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'inline_comment.mention.created',
        inlineCommentId: inlineComment.id,
        mentionId: mention2Id,
        pageId: createdPage.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    const inlineCommentMentionCreatedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'inline_comment.mention.created',
        inlineCommentId: thread.comments[0].id,
        mentionId,
        pageId: createdPage.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    expect(inlineCommentMentionCreatedNotification).toBeTruthy();
    expect(inlineCommentCreatedNotification).toBeTruthy();
    expect(inlineCommentRepliedNotification).toBeTruthy();
    // Don't send multiple notification to the same user for the same event
    expect(inlineCommentMention2CreatedNotification).toBeFalsy();
  });

  it(`Should create document notifications for application_comment.created event`, async () => {
    const { space, user: rewardAuthor } = await generateUserAndSpace({ isAdmin: true });
    const rewardApplicant = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });
    const rewardReviewer1 = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const rewardReviewer2 = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const rewardReviewer3 = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const role = await createRole({
      spaceId: space.id
    });

    await assignRole({
      roleId: role.id,
      userId: rewardReviewer1.id
    });

    const reward = await testUtilsBounties.generateBounty({
      spaceId: space.id,
      createdBy: rewardAuthor.id,
      status: 'open',
      approveSubmitters: false,
      bountyPermissions: {
        reviewer: [
          {
            group: 'role',
            id: role.id
          },
          {
            group: 'user',
            id: rewardReviewer2.id
          },
          {
            group: 'user',
            id: rewardReviewer3.id
          }
        ]
      },
      pagePermissions: [{ permissionLevel: 'full_access', assignee: { group: 'space', id: space.id } }]
    });

    const submission = await work({
      rewardId: reward.id,
      submission: 'Hello world',
      submissionNodes: _.doc(_.p('Hello world')).toJSON(),
      walletAddress: randomETHWalletAddress(),
      userId: rewardApplicant.id
    });

    const applicationComment = await prisma.applicationComment.create({
      data: {
        applicationId: submission.id,
        content: _.doc(_.p('Hello World')).toJSON(),
        contentText: 'Hello World',
        createdBy: rewardReviewer3.id
      }
    });

    const document = await getDocumentEntity(reward.page.id);
    const spaceEntity = await getSpaceEntity(space.id);

    await createDocumentNotifications({
      event: {
        scope: WebhookEventNames.DocumentApplicationCommentCreated,
        document,
        space: spaceEntity,
        applicationComment: await getApplicationCommentEntity(applicationComment.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const rewardApplicationComment1Reviewer1Notification = await prisma.documentNotification.findFirst({
      where: {
        type: 'application_comment.created',
        pageId: reward.page.id,
        applicationCommentId: applicationComment.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: rewardReviewer1.id
        }
      }
    });

    const rewardApplicationComment1Reviewer2Notification = await prisma.documentNotification.findFirst({
      where: {
        type: 'application_comment.created',
        pageId: reward.page.id,
        applicationCommentId: applicationComment.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: rewardReviewer2.id
        }
      }
    });

    const rewardApplicationComment1Reviewer3Notification = await prisma.documentNotification.findFirst({
      where: {
        type: 'application_comment.created',
        pageId: reward.page.id,
        applicationCommentId: applicationComment.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: rewardReviewer3.id
        }
      }
    });

    const rewardApplicationComment1RewardAuthorNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'application_comment.created',
        pageId: reward.page.id,
        applicationCommentId: applicationComment.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: rewardAuthor.id
        }
      }
    });

    const rewardApplicationComment1RewardApplicantNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'application_comment.created',
        pageId: reward.page.id,
        applicationCommentId: applicationComment.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: rewardApplicant.id
        }
      }
    });

    expect(rewardApplicationComment1Reviewer1Notification).toBeTruthy();
    expect(rewardApplicationComment1Reviewer2Notification).toBeTruthy();
    expect(rewardApplicationComment1Reviewer3Notification).toBeFalsy();
    expect(rewardApplicationComment1RewardAuthorNotification).toBeFalsy();
    expect(rewardApplicationComment1RewardApplicantNotification).toBeTruthy();

    const mentionId = v4();
    const replyApplicationComment = await prisma.applicationComment.create({
      data: {
        applicationId: submission.id,
        content: _.doc(
          _.p('Hello World'),
          _.mention({
            id: mentionId,
            type: 'user',
            value: rewardReviewer1.id,
            createdAt: new Date().toISOString(),
            createdBy: rewardApplicant.id
          })
        ).toJSON(),
        contentText: 'Hello World',
        createdBy: rewardApplicant.id,
        parentId: applicationComment.id
      }
    });

    await createDocumentNotifications({
      event: {
        scope: WebhookEventNames.DocumentApplicationCommentCreated,
        document,
        space: spaceEntity,
        applicationComment: await getApplicationCommentEntity(replyApplicationComment.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const rewardApplicationCommentReplyReviewer1Notification = await prisma.documentNotification.findFirst({
      where: {
        type: 'application_comment.replied',
        pageId: reward.page.id,
        applicationCommentId: replyApplicationComment.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: rewardReviewer1.id
        }
      }
    });

    const rewardApplicationCommentReplyReviewer2Notification = await prisma.documentNotification.findFirst({
      where: {
        type: 'application_comment.replied',
        pageId: reward.page.id,
        applicationCommentId: replyApplicationComment.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: rewardReviewer2.id
        }
      }
    });

    const rewardApplicationCommentReplyReviewer3Notification = await prisma.documentNotification.findFirst({
      where: {
        type: 'application_comment.replied',
        pageId: reward.page.id,
        applicationCommentId: replyApplicationComment.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: rewardReviewer3.id
        }
      }
    });

    const rewardApplicationCommentReplyRewardAuthorNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'application_comment.replied',
        pageId: reward.page.id,
        applicationCommentId: replyApplicationComment.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: rewardAuthor.id
        }
      }
    });

    const rewardApplicationCommentReplyRewardApplicantNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'application_comment.replied',
        pageId: reward.page.id,
        applicationCommentId: replyApplicationComment.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: rewardApplicant.id
        }
      }
    });

    const rewardApplicationCommentReplyMentionRewardReviewer1Notification = await prisma.documentNotification.findFirst(
      {
        where: {
          type: 'application_comment.mention.created',
          pageId: reward.page.id,
          applicationCommentId: replyApplicationComment.id,
          notificationMetadata: {
            spaceId: space.id,
            userId: rewardReviewer1.id
          }
        }
      }
    );

    expect(rewardApplicationCommentReplyReviewer1Notification).toBeFalsy();
    expect(rewardApplicationCommentReplyReviewer2Notification).toBeFalsy();
    expect(rewardApplicationCommentReplyReviewer3Notification).toBeTruthy();
    expect(rewardApplicationCommentReplyRewardAuthorNotification).toBeFalsy();
    expect(rewardApplicationCommentReplyRewardApplicantNotification).toBeFalsy();
    expect(rewardApplicationCommentReplyMentionRewardReviewer1Notification).toBeTruthy();
  });

  it(`Should create document notifications for page.comment.created event`, async () => {
    const { space, user } = await generateUserAndSpace({ isAdmin: true });
    const user2 = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const page = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      authors: [user.id],
      proposalStatus: 'published',
      evaluationInputs: [{ evaluationType: 'rubric', permissions: [], reviewers: [{ group: 'user', id: user2.id }] }]
    });

    const mentionId = v4();
    const mention2Id = v4();

    const pageComment1 = await createPageComment({
      content: _.doc(
        _.p('Hello World'),
        _.mention({
          id: mentionId,
          type: 'user',
          value: user2.id,
          createdAt: new Date().toISOString(),
          createdBy: user.id
        })
      ).toJSON(),
      contentText: 'Hello World',
      pageId: page.id,
      userId: user.id
    });

    const pageComment1Reply = await createPageComment({
      content: _.doc(
        _.p('Hello World'),
        _.mention({
          id: mention2Id,
          type: 'user',
          value: user.id,
          createdAt: new Date().toISOString(),
          createdBy: user2.id
        })
      ).toJSON(),
      contentText: 'Hello World',
      pageId: page.id,
      userId: user2.id,
      parentId: pageComment1.id
    });

    const pageComment2 = await createPageComment({
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
        comment: await getCommentEntity(pageComment1.id),
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
        comment: await getCommentEntity(pageComment1Reply.id),
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
        comment: await getCommentEntity(pageComment2.id),
        space: spaceEntity,
        document: documentEntity,
        post: null
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const proposalComment2CreatedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'comment.created',
        pageId: page.id,
        pageCommentId: pageComment2.id,
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
        pageCommentId: pageComment1Reply.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const commentMentionCreatedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'comment.mention.created',
        pageId: page.id,
        mentionId: mention2Id,
        pageCommentId: pageComment1Reply.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const comment1MentionCreatedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'comment.mention.created',
        pageCommentId: pageComment1.id,
        mentionId,
        pageId: page.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    expect(comment1MentionCreatedNotification).toBeTruthy();
    expect(proposalComment2CreatedNotification).toBeTruthy();
    expect(proposalCommentRepliedNotification).toBeTruthy();
    expect(commentMentionCreatedNotification).toBeFalsy();
  });

  it(`Should create document notifications for post.comment.created event`, async () => {
    const { space, user } = await generateUserAndSpace({ isAdmin: true });
    const user2 = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const postCategory = await generatePostCategory({ spaceId: space.id, fullAccess: true });

    const mentionId = v4();
    const mention2Id = v4();

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
      content: _.doc(
        _.p('Hello World'),
        _.mention({
          id: mentionId,
          type: 'user',
          value: user2.id,
          createdAt: new Date().toISOString(),
          createdBy: user.id
        })
      ).toJSON(),
      contentText: 'Hello World',
      postId: post.id,
      userId: user.id
    });

    const postComment1Reply = await createPostComment({
      content: _.doc(
        _.p('Hello World'),
        _.mention({
          id: mention2Id,
          type: 'user',
          value: user.id,
          createdAt: new Date().toISOString(),
          createdBy: user2.id
        })
      ).toJSON(),
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

    const comment1ReplyMentionCreatedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'comment.mention.created',
        postId: post.id,
        mentionId: mention2Id,
        postCommentId: postComment1Reply.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const comment1MentionCreatedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'comment.mention.created',
        postId: post.id,
        mentionId,
        postCommentId: postComment1.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    expect(postCommentCreatedNotification).toBeTruthy();
    expect(postCommentRepliedNotification).toBeTruthy();
    expect(comment1MentionCreatedNotification).toBeTruthy();
    expect(comment1ReplyMentionCreatedNotification).toBeFalsy();
  });
});
