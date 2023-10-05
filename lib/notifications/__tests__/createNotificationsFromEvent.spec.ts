import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { approveApplication, createApplication, reviewSubmission, updateSubmission } from 'lib/applications/actions';
import { createBounty } from 'lib/bounties';
import { addComment } from 'lib/comments/addComment';
import { createPostComment } from 'lib/forums/comments/createPostComment';
import { createForumPost } from 'lib/forums/posts/createForumPost';
import { createPageComment } from 'lib/pages/comments/createPageComment';
import { createCardPage } from 'lib/pages/createCardPage';
import { premiumPermissionsApiClient } from 'lib/permissions/api/routers';
import { createProposal } from 'lib/proposal/createProposal';
import { updateProposalStatus } from 'lib/proposal/updateProposalStatus';
import { emptyDocument } from 'lib/prosemirror/constants';
import { createDatabase } from 'lib/public-api/createDatabase';
import { assignRole } from 'lib/roles';
import { createThread } from 'lib/threads';
import { createUserFromWallet } from 'lib/users/createUser';
import { createVote } from 'lib/votes';
import {
  getApplicationEntity,
  getBlockCommentEntity,
  getBountyEntity,
  getCommentEntity,
  getDocumentEntity,
  getInlineCommentEntity,
  getPostEntity,
  getProposalEntity,
  getSpaceEntity,
  getUserEntity,
  getVoteEntity
} from 'lib/webhookPublisher/entities';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { createBlock, createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generatePostCategory } from 'testing/utils/forums';
import { generateProposalCategory } from 'testing/utils/proposals';
import { createRole } from 'testing/utils/roles';
import { addUserToSpace } from 'testing/utils/spaces';

import { createNotificationsFromEvent } from '../createNotificationsFromEvent';

describe(`Test document events and notifications`, () => {
  it(`Should create document notifications for mention.created event`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const createdPage = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const mentionId = v4();

    await createNotificationsFromEvent({
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
    const user2 = await createUserFromWallet();
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

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.DocumentInlineCommentCreated,
        document: await getDocumentEntity(createdPage.id),
        space: await getSpaceEntity(space.id),
        user: await getUserEntity(user2.id),
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

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.DocumentInlineCommentCreated,
        document: await getDocumentEntity(createdPage.id),
        space: await getSpaceEntity(space.id),
        user: await getUserEntity(user2.id),
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

describe(`Test card events and notifications`, () => {
  it(`Should create card notifications for block_comment.created event`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const databasePage = await createDatabase({
      createdBy: user.id,
      spaceId: space.id,
      title: 'Example title'
    });

    const cardPage = await createCardPage({
      boardId: databasePage.id,
      createdBy: user.id,
      properties: {},
      spaceId: space.id,
      title: 'Example title'
    });

    const mentionId = v4();

    const blockComment = await createBlock({
      createdBy: user.id,
      type: 'comment',
      rootId: databasePage.id,
      parentId: cardPage.block.id,
      fields: {
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
                    value: user2.id,
                    createdAt: new Date().toISOString(),
                    createdBy: user.id
                  }
                }
              ]
            }
          ]
        }
      },
      spaceId: space.id
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.CardBlockCommentCreated,
        card: await getDocumentEntity(cardPage.page.id),
        space: await getSpaceEntity(space.id),
        blockComment: await getBlockCommentEntity(blockComment.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const blockComment2 = await createBlock({
      createdBy: user2.id,
      type: 'comment',
      rootId: databasePage.id,
      parentId: cardPage.block.id,
      fields: {
        content: emptyDocument
      },
      spaceId: space.id
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.CardBlockCommentCreated,
        card: await getDocumentEntity(cardPage.page.id),
        space: await getSpaceEntity(space.id),
        blockComment: await getBlockCommentEntity(blockComment2.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const blockComment3 = await createBlock({
      createdBy: user2.id,
      type: 'comment',
      rootId: databasePage.id,
      parentId: cardPage.block.id,
      fields: {
        content: emptyDocument
      },
      spaceId: space.id
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.CardBlockCommentCreated,
        card: await getDocumentEntity(cardPage.page.id),
        space: await getSpaceEntity(space.id),
        blockComment: await getBlockCommentEntity(blockComment3.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const blockCommentMentionCreatedNotification = await prisma.cardNotification.findFirst({
      where: {
        type: 'block_comment.mention.created',
        blockCommentId: blockComment.id,
        cardId: cardPage.block.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    const blockCommentRepliedNotification = await prisma.cardNotification.findFirst({
      where: {
        type: 'block_comment.replied',
        blockCommentId: blockComment2.id,
        cardId: cardPage.block.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const blockCommentCreatedNotification = await prisma.cardNotification.findFirst({
      where: {
        type: 'block_comment.created',
        blockCommentId: blockComment3.id,
        cardId: cardPage.block.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    expect(blockCommentMentionCreatedNotification).toBeTruthy();
    expect(blockCommentRepliedNotification).toBeTruthy();
    expect(blockCommentCreatedNotification).toBeTruthy();
  });
});

describe(`Test forum events and notifications`, () => {
  it(`Should create post notifications for forum.post.created event`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    // Doesn't have access to post category
    const user3 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user3.id
    });

    const postCategory = await generatePostCategory({ spaceId: space.id });

    const mentionId = v4();

    const post = await createForumPost({
      categoryId: postCategory.id,
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
                  value: user2.id,
                  createdAt: new Date().toISOString(),
                  createdBy: user.id
                }
              }
            ]
          }
        ]
      },
      contentText: 'Hello World',
      createdBy: user.id,
      isDraft: false,
      spaceId: space.id,
      title: 'Hello World'
    });

    const role = await createRole({
      spaceId: space.id,
      name: 'Post Moderator'
    });

    await premiumPermissionsApiClient.forum.upsertPostCategoryPermission({
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id,
      assignee: {
        group: 'role',
        id: role.id
      }
    });

    await assignRole({
      roleId: role.id,
      userId: user.id
    });

    await assignRole({
      roleId: role.id,
      userId: user2.id
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.ForumPostCreated,
        post: await getPostEntity(post.id),
        space: await getSpaceEntity(space.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const postCreatedNotification = await prisma.postNotification.findFirst({
      where: {
        type: 'created',
        postId: post.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    // Since user3 doesn't have access to the post category, they shouldn't get a notification
    const postCreatedUser3Notification = await prisma.postNotification.findFirst({
      where: {
        type: 'created',
        postId: post.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user3.id
        }
      }
    });

    const postMentionCreatedNotification = await prisma.postNotification.findFirst({
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

    expect(postCreatedNotification).toBeTruthy();
    expect(postCreatedUser3Notification).toBeFalsy();
    expect(postMentionCreatedNotification).toBeTruthy();
  });

  it(`Should create post notifications for forum.comment.created event`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const postCategory = await generatePostCategory({ spaceId: space.id });

    const mentionId = v4();

    const post = await createForumPost({
      categoryId: postCategory.id,
      content: {
        type: 'doc',
        content: emptyDocument
      },
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
        scope: WebhookEventNames.ForumCommentCreated,
        comment: await getCommentEntity(postComment1.id, true),
        post: postEntity,
        space: spaceEntity
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.ForumCommentCreated,
        comment: await getCommentEntity(postComment1Reply.id, true),
        post: postEntity,
        space: spaceEntity
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.ForumCommentCreated,
        comment: await getCommentEntity(postComment2.id, true),
        post: postEntity,
        space: spaceEntity
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const postCommentCreatedNotification = await prisma.postNotification.findFirst({
      where: {
        type: 'comment.created',
        postId: post.id,
        commentId: postComment2.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const postCommentRepliedNotification = await prisma.postNotification.findFirst({
      where: {
        type: 'comment.replied',
        postId: post.id,
        commentId: postComment1Reply.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const commentMentionCreatedNotification = await prisma.postNotification.findFirst({
      where: {
        type: 'comment.mention.created',
        postId: post.id,
        mentionId,
        commentId: postComment1Reply.id,
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

describe(`Test vote events and notifications`, () => {
  it(`Should create vote notifications for vote.created event`, async () => {
    // User 1 will create both the page and post
    // User 2 will be able to access the post since he has access to the post category
    // user 2 will not be able to access the page since he doesn't have access to the page category
    // the opposite is true for user 3

    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    // Doesn't have access to post category
    const user3 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user3.id
    });

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
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

    const postModeratorRole = await createRole({
      spaceId: space.id,
      name: 'Post Moderator'
    });

    await premiumPermissionsApiClient.forum.upsertPostCategoryPermission({
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id,
      assignee: {
        group: 'role',
        id: postModeratorRole.id
      }
    });

    await assignRole({
      roleId: postModeratorRole.id,
      userId: user.id
    });

    await assignRole({
      roleId: postModeratorRole.id,
      userId: user2.id
    });

    const pageVote = await createVote({
      content: emptyDocument,
      contentText: '',
      context: 'inline',
      createdBy: user.id,
      deadline: new Date(),
      maxChoices: 3,
      spaceId: space.id,
      threshold: 2,
      title: 'Vote',
      type: 'Approval',
      voteOptions: [],
      pageId: page.id
    });

    const postVote = await createVote({
      content: emptyDocument,
      contentText: '',
      context: 'inline',
      createdBy: user.id,
      deadline: new Date(),
      maxChoices: 3,
      spaceId: space.id,
      threshold: 2,
      title: 'Vote',
      type: 'Approval',
      voteOptions: [],
      postId: post.id
    });

    await premiumPermissionsApiClient.pages.upsertPagePermission({
      pageId: page.id,
      permission: {
        assignee: {
          group: 'user',
          id: user3.id
        },
        permissionLevel: 'full_access'
      }
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.VoteCreated,
        space: await getSpaceEntity(space.id),
        vote: await getVoteEntity(pageVote.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.VoteCreated,
        space: await getSpaceEntity(space.id),
        vote: await getVoteEntity(postVote.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const newPageVoteNotification = await prisma.voteNotification.findFirst({
      where: {
        type: 'new_vote',
        voteId: pageVote.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user3.id
        }
      }
    });

    const newPageUser2VoteNotification = await prisma.voteNotification.findFirst({
      where: {
        type: 'new_vote',
        voteId: pageVote.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    const newPostVoteNotification = await prisma.voteNotification.findFirst({
      where: {
        type: 'new_vote',
        voteId: postVote.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    const newPostUser3VoteNotification = await prisma.voteNotification.findFirst({
      where: {
        type: 'new_vote',
        voteId: postVote.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user3.id
        }
      }
    });

    expect(newPageVoteNotification).toBeTruthy();
    expect(newPageUser2VoteNotification).toBeFalsy();
    expect(newPostVoteNotification).toBeTruthy();
    expect(newPostUser3VoteNotification).toBeFalsy();
  });
});

describe(`Test proposal events and notifications`, () => {
  it(`Should create proposal notifications for proposal.mention.created event`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });

    const { proposal } = await createProposal({
      categoryId: proposalCategory.id,
      spaceId: space.id,
      userId: user.id
    });

    const mentionId = v4();

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.ProposalMentionCreated,
        proposal: await getProposalEntity(proposal.id),
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

    const mentionCreatedProposalNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'mention.created',
        mentionId,
        proposalId: proposal.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    expect(mentionCreatedProposalNotification).toBeTruthy();
  });

  it(`Should create proposal notifications for inline_comment.created event`, async () => {
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

    const thread = await createThread({
      context: 'Hello World',
      pageId: page.id,
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

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.ProposalInlineCommentCreated,
        proposal: await getProposalEntity(proposal.id),
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

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.ProposalInlineCommentCreated,
        proposal: await getProposalEntity(proposal.id),
        space: await getSpaceEntity(space.id),
        inlineComment: await getInlineCommentEntity(inlineComment2.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const inlineCommentCreatedNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'inline_comment.created',
        inlineCommentId: inlineComment2.id,
        proposalId: proposal.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const inlineCommentRepliedNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'inline_comment.replied',
        inlineCommentId: inlineComment.id,
        proposalId: proposal.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const inlineCommentMentionCreatedNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'inline_comment.mention.created',
        inlineCommentId: inlineComment.id,
        mentionId,
        proposalId: proposal.id,
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

  it(`Should create proposal notifications for proposal.comment.created event`, async () => {
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

    const proposalEntity = await getProposalEntity(proposal.id);
    const spaceEntity = await getSpaceEntity(space.id);

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.ProposalCommentCreated,
        comment: await getCommentEntity(proposalComment1.id),
        proposal: proposalEntity,
        space: spaceEntity
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.ProposalCommentCreated,
        comment: await getCommentEntity(proposalComment1Reply.id),
        proposal: proposalEntity,
        space: spaceEntity
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.ProposalCommentCreated,
        comment: await getCommentEntity(proposalComment2.id),
        proposal: proposalEntity,
        space: spaceEntity
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const proposalCommentCreatedNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'comment.created',
        proposalId: proposal.id,
        commentId: proposalComment2.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const proposalCommentRepliedNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'comment.replied',
        proposalId: proposal.id,
        commentId: proposalComment1Reply.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const commentMentionCreatedNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'comment.mention.created',
        proposalId: proposal.id,
        mentionId,
        commentId: proposalComment1Reply.id,
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

  it(`Should create proposal notifications for proposal.status_changed event`, async () => {
    const { space } = await generateUserAndSpaceWithApiToken();
    const author1 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: author1.id
    });
    const author2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: author2.id
    });
    const reviewer = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: reviewer.id
    });

    const member1 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: member1.id
    });

    // Member 2 doesn't have any access to proposal category, so notifications shouldn't be created for them
    const member2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: member2.id
    });

    const role = await createRole({
      spaceId: space.id,
      name: 'Post Moderators'
    });

    await Promise.all(
      [author1.id, author2.id, reviewer.id, member1.id].map((userId) =>
        assignRole({
          roleId: role.id,
          userId
        })
      )
    );

    const proposalCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id,
      proposalCategoryPermissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'role', id: role.id }
        }
      ]
    });

    const { proposal } = await createProposal({
      categoryId: proposalCategory.id,
      spaceId: space.id,
      userId: author1.id,
      authors: [author1.id, author2.id],
      reviewers: [
        {
          group: 'user',
          id: author1.id
        },
        {
          group: 'user',
          id: reviewer.id
        }
      ]
    });

    const spaceEntity = await getSpaceEntity(space.id);
    const proposalEntity = await getProposalEntity(proposal.id);

    // Move to discussion status

    await updateProposalStatus({
      newStatus: 'discussion',
      proposalId: proposal.id,
      userId: author1.id
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.ProposalStatusChanged,
        proposal: proposalEntity,
        newStatus: 'discussion',
        oldStatus: 'draft',
        space: spaceEntity,
        user: await getUserEntity(author1.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const proposalDiscussionStatusChangedAuthorNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'start_review',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: author2.id,
          spaceId: space.id
        }
      }
    });

    const proposalDiscussionStatusChangedReviewerNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'start_discussion',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: reviewer.id,
          spaceId: space.id
        }
      }
    });

    const proposalDiscussionStatusChangedMember1Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'start_discussion',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: member1.id,
          spaceId: space.id
        }
      }
    });

    const proposalDiscussionStatusChangedMember2Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'start_discussion',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: member2.id,
          spaceId: space.id
        }
      }
    });

    expect(proposalDiscussionStatusChangedAuthorNotification).toBeTruthy();
    expect(proposalDiscussionStatusChangedReviewerNotification).toBeTruthy();
    expect(proposalDiscussionStatusChangedMember1Notification).toBeTruthy();
    expect(proposalDiscussionStatusChangedMember2Notification).toBeTruthy();

    // Move to review status

    await updateProposalStatus({
      newStatus: 'review',
      proposalId: proposal.id,
      userId: author1.id
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.ProposalStatusChanged,
        proposal: proposalEntity,
        newStatus: 'review',
        oldStatus: 'discussion',
        space: spaceEntity,
        user: await getUserEntity(author1.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const proposalReviewStatusChangedAuthorNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'needs_review',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: author2.id,
          spaceId: space.id
        }
      }
    });

    const proposalReviewStatusChangedReviewerNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'needs_review',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: reviewer.id,
          spaceId: space.id
        }
      }
    });

    const proposalReviewStatusChangedMember1Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'needs_review',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: member1.id,
          spaceId: space.id
        }
      }
    });

    const proposalReviewStatusChangedMember2Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'needs_review',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: member2.id,
          spaceId: space.id
        }
      }
    });

    expect(proposalReviewStatusChangedAuthorNotification).toBeFalsy();
    expect(proposalReviewStatusChangedReviewerNotification).toBeTruthy();
    expect(proposalReviewStatusChangedMember1Notification).toBeFalsy();
    expect(proposalReviewStatusChangedMember2Notification).toBeFalsy();

    // Move to reviewed status

    await updateProposalStatus({
      newStatus: 'reviewed',
      proposalId: proposal.id,
      userId: author1.id
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.ProposalStatusChanged,
        proposal: proposalEntity,
        newStatus: 'reviewed',
        oldStatus: 'review',
        space: spaceEntity,
        user: await getUserEntity(author1.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const proposalReviewedStatusChangedAuthorNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'reviewed',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: author2.id,
          spaceId: space.id
        }
      }
    });

    const proposalReviewedStatusChangedReviewerNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'reviewed',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: reviewer.id,
          spaceId: space.id
        }
      }
    });

    const proposalReviewedStatusChangedMember1Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'reviewed',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: member1.id,
          spaceId: space.id
        }
      }
    });

    const proposalReviewedStatusChangedMember2Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'reviewed',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: member2.id,
          spaceId: space.id
        }
      }
    });

    expect(proposalReviewedStatusChangedAuthorNotification).toBeTruthy();
    expect(proposalReviewedStatusChangedReviewerNotification).toBeFalsy();
    expect(proposalReviewedStatusChangedMember1Notification).toBeFalsy();
    expect(proposalReviewedStatusChangedMember2Notification).toBeFalsy();

    // Move to vote_active status

    await updateProposalStatus({
      newStatus: 'vote_active',
      proposalId: proposal.id,
      userId: author1.id
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.ProposalStatusChanged,
        proposal: proposalEntity,
        newStatus: 'vote_active',
        oldStatus: 'reviewed',
        space: spaceEntity,
        user: await getUserEntity(author1.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const proposalVoteActiveStatusChangedAuthorNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'vote',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: author2.id,
          spaceId: space.id
        }
      }
    });

    const proposalVoteActiveStatusChangedReviewerNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'vote',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: reviewer.id,
          spaceId: space.id
        }
      }
    });

    const proposalVoteActiveStatusChangedMember1Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'vote',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: member1.id,
          spaceId: space.id
        }
      }
    });

    const proposalVoteActiveStatusChangedMember2Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'vote',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: member2.id,
          spaceId: space.id
        }
      }
    });

    expect(proposalVoteActiveStatusChangedAuthorNotification).toBeTruthy();
    expect(proposalVoteActiveStatusChangedReviewerNotification).toBeTruthy();
    expect(proposalVoteActiveStatusChangedMember1Notification).toBeTruthy();
    expect(proposalVoteActiveStatusChangedMember2Notification).toBeTruthy();
  });
});

describe(`Test bounty events and notifications`, () => {
  it(`Should create bounty notifications for mention.created event`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const createdBounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id
    });

    const mentionId = v4();

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.BountyMentionCreated,
        bounty: await getBountyEntity(createdBounty.id),
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

    const mentionCreatedBountyNotification = await prisma.bountyNotification.findFirst({
      where: {
        type: 'mention.created',
        mentionId,
        bountyId: createdBounty.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    expect(mentionCreatedBountyNotification).toBeTruthy();
  });

  it(`Should create bounty notifications for inline_comment.created event`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id
    });

    const thread = await createThread({
      context: 'Hello World',
      pageId: bounty.page.id,
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

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.BountyInlineCommentCreated,
        bounty: await getBountyEntity(bounty.id),
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

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.BountyInlineCommentCreated,
        bounty: await getBountyEntity(bounty.id),
        space: await getSpaceEntity(space.id),
        inlineComment: await getInlineCommentEntity(inlineComment2.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const inlineCommentCreatedNotification = await prisma.bountyNotification.findFirst({
      where: {
        type: 'inline_comment.created',
        inlineCommentId: inlineComment2.id,
        bountyId: bounty.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const inlineCommentRepliedNotification = await prisma.bountyNotification.findFirst({
      where: {
        type: 'inline_comment.replied',
        inlineCommentId: inlineComment.id,
        bountyId: bounty.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const inlineCommentMentionCreatedNotification = await prisma.bountyNotification.findFirst({
      where: {
        type: 'inline_comment.mention.created',
        inlineCommentId: inlineComment.id,
        mentionId,
        bountyId: bounty.id,
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

  it(`Should create bounty notifications for application.created event`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1,
      rewardToken: 'ETH',
      permissions: {
        reviewer: [
          {
            group: 'user',
            id: user.id
          }
        ]
      }
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'Hello World',
      userId: user2.id
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.BountyApplicationCreated,
        bounty: await getBountyEntity(bounty.id),
        space: await getSpaceEntity(space.id),
        application: await getApplicationEntity(application.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const applicationPendingReviewerNotification = await prisma.bountyNotification.findFirst({
      where: {
        type: 'application.pending',
        applicationId: application.id,
        bountyId: bounty.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    expect(applicationPendingReviewerNotification).toBeTruthy();
  });

  it(`Should create bounty notifications for application.accepted event`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'Hello World',
      userId: user2.id
    });

    await approveApplication({
      applicationOrApplicationId: application.id,
      userId: user.id
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.BountyApplicationAccepted,
        bounty: await getBountyEntity(bounty.id),
        space: await getSpaceEntity(space.id),
        application: await getApplicationEntity(application.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const applicationAcceptedNotification = await prisma.bountyNotification.findFirst({
      where: {
        type: 'application.accepted',
        applicationId: application.id,
        bountyId: bounty.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    expect(applicationAcceptedNotification).toBeTruthy();
  });

  it(`Should create bounty notifications for application.rejected event`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'Hello World',
      userId: user2.id
    });

    await reviewSubmission({
      decision: 'reject',
      submissionId: application.id,
      userId: user.id
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.BountyApplicationRejected,
        bounty: await getBountyEntity(bounty.id),
        space: await getSpaceEntity(space.id),
        application: await getApplicationEntity(application.id),
        user: await getUserEntity(user.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const applicationRejectedNotification = await prisma.bountyNotification.findFirst({
      where: {
        type: 'application.rejected',
        applicationId: application.id,
        bountyId: bounty.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    expect(applicationRejectedNotification).toBeTruthy();
  });

  it(`Should create bounty notifications for application.submitted event`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1,
      chainId: 1,
      permissions: {
        reviewer: [
          {
            group: 'user',
            id: user.id
          }
        ]
      }
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'Hello World',
      userId: user2.id
    });

    await approveApplication({
      applicationOrApplicationId: application.id,
      userId: user.id
    });

    await updateSubmission({
      customReward: false,
      submissionContent: {
        walletAddress: user2.wallets[0].address,
        submissionNodes: 'Hello World'
      },
      submissionId: application.id
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.BountyApplicationSubmitted,
        bounty: await getBountyEntity(bounty.id),
        space: await getSpaceEntity(space.id),
        application: await getApplicationEntity(application.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const applicationSubmittedNotification = await prisma.bountyNotification.findFirst({
      where: {
        type: 'application.submitted',
        applicationId: application.id,
        bountyId: bounty.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    expect(applicationSubmittedNotification).toBeTruthy();
  });

  it(`Should create bounty notifications for application.approved event`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1,
      chainId: 1,
      permissions: {
        reviewer: [
          {
            group: 'user',
            id: user.id
          }
        ]
      }
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'Hello World',
      userId: user2.id
    });

    await approveApplication({
      applicationOrApplicationId: application.id,
      userId: user.id
    });

    await updateSubmission({
      customReward: false,
      submissionContent: {
        walletAddress: user2.wallets[0].address,
        submissionNodes: 'Hello World'
      },
      submissionId: application.id
    });

    await reviewSubmission({
      decision: 'approve',
      submissionId: application.id,
      userId: user.id
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.BountyApplicationApproved,
        bounty: await getBountyEntity(bounty.id),
        space: await getSpaceEntity(space.id),
        application: await getApplicationEntity(application.id),
        user: await getUserEntity(user.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const applicationApprovedNotification = await prisma.bountyNotification.findFirst({
      where: {
        type: 'application.approved',
        applicationId: application.id,
        bountyId: bounty.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    const applicationPaymentPendingNotification = await prisma.bountyNotification.findFirst({
      where: {
        type: 'application.payment_pending',
        applicationId: application.id,
        bountyId: bounty.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    expect(applicationApprovedNotification).toBeTruthy();
    expect(applicationPaymentPendingNotification).toBeTruthy();
  });

  it(`Should create bounty notifications for application.payment_completed event`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1,
      chainId: 1,
      permissions: {
        reviewer: [
          {
            group: 'user',
            id: user.id
          }
        ]
      }
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'Hello World',
      userId: user2.id
    });

    await approveApplication({
      applicationOrApplicationId: application.id,
      userId: user.id
    });

    await updateSubmission({
      customReward: false,
      submissionContent: {
        walletAddress: user2.wallets[0].address,
        submissionNodes: 'Hello World'
      },
      submissionId: application.id
    });

    await reviewSubmission({
      decision: 'approve',
      submissionId: application.id,
      userId: user.id
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.BountyApplicationPaymentCompleted,
        bounty: await getBountyEntity(bounty.id),
        space: await getSpaceEntity(space.id),
        application: await getApplicationEntity(application.id),
        user: await getUserEntity(user.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const applicationPaymentCompletedNotification = await prisma.bountyNotification.findFirst({
      where: {
        type: 'application.payment_completed',
        applicationId: application.id,
        bountyId: bounty.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    expect(applicationPaymentCompletedNotification).toBeTruthy();
  });
});
