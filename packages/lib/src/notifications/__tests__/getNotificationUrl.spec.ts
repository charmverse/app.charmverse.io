import { v4 } from 'uuid';

import { getNotificationUrl } from '../getNotificationUrl';

describe('getNotificationUrl', () => {
  it(`Should return the correct url for a document notification`, () => {
    const commentId = v4();
    const inlineCommentId = v4();
    const applicationCommentId = v4();
    const mentionId = v4();
    const applicationId = v4();

    const commentCreatedNotificationUrl = getNotificationUrl({
      type: 'comment.created',
      applicationCommentId: null,
      applicationId: null,
      commentId,
      group: 'document',
      inlineCommentId: null,
      pagePath: 'post-1',
      pageType: 'post',
      mentionId: null
    });
    expect(commentCreatedNotificationUrl).toBe(`/forum/post/post-1?commentId=${commentId}`);

    const inlineCommentCreatedNotificationUrl = getNotificationUrl({
      type: 'inline_comment.created',
      applicationCommentId: null,
      applicationId: null,
      commentId: null,
      group: 'document',
      inlineCommentId,
      pagePath: 'page-1',
      pageType: 'page',
      mentionId: null
    });
    expect(inlineCommentCreatedNotificationUrl).toBe(`/page-1?inlineCommentId=${inlineCommentId}`);

    const applicationCommentCreatedNotificationUrl = getNotificationUrl({
      type: 'application_comment.created',
      applicationCommentId,
      applicationId,
      commentId: null,
      group: 'document',
      inlineCommentId: null,
      pagePath: 'application-1',
      pageType: 'bounty',
      mentionId: null
    });
    expect(applicationCommentCreatedNotificationUrl).toBe(
      `/rewards/applications/${applicationId}?commentId=${applicationCommentId}`
    );

    const mentionCreatedNotificationUrl = getNotificationUrl({
      type: 'mention.created',
      applicationCommentId: null,
      applicationId: null,
      commentId: null,
      group: 'document',
      inlineCommentId: null,
      pagePath: 'page-1',
      pageType: 'page',
      mentionId
    });
    expect(mentionCreatedNotificationUrl).toBe(`/page-1?mentionId=${mentionId}`);

    const applicationCommentMentionCreatedNotificationUrl = getNotificationUrl({
      type: 'application_comment.mention.created',
      applicationCommentId,
      applicationId,
      commentId: null,
      group: 'document',
      inlineCommentId: null,
      pagePath: 'application-1',
      pageType: 'bounty',
      mentionId
    });
    expect(applicationCommentMentionCreatedNotificationUrl).toBe(
      `/rewards/applications/${applicationId}?commentId=${applicationCommentId}&mentionId=${mentionId}`
    );
  });

  it(`Should return the correct url for a bounty, card and proposal notification`, () => {
    const bountyNotificationUrl = getNotificationUrl({
      group: 'bounty',
      pagePath: 'bounty-1'
    });
    expect(bountyNotificationUrl).toBe('/bounty-1');

    const cardNotificationUrl = getNotificationUrl({
      group: 'card',
      pagePath: 'card-1'
    });
    expect(cardNotificationUrl).toBe('/card-1');

    const proposalNotificationUrl = getNotificationUrl({
      group: 'proposal',
      pagePath: 'proposal-1'
    });
    expect(proposalNotificationUrl).toBe('/proposal-1');
  });

  it(`Should return the correct url for a post notification`, () => {
    const postNotificationUrl = getNotificationUrl({
      group: 'post',
      postPath: 'post-1'
    });
    expect(postNotificationUrl).toBe('/forum/post/post-1');
  });

  it(`Should return the correct url for a vote notification`, () => {
    const voteId = v4();
    const postVoteNotificationUrl = getNotificationUrl({
      group: 'vote',
      pageType: 'post',
      pagePath: 'post-1',
      voteId
    });
    expect(postVoteNotificationUrl).toBe(`/forum/post/post-1?voteId=${voteId}`);

    const pageVoteNotificationUrl = getNotificationUrl({
      group: 'vote',
      pageType: 'page',
      pagePath: 'page-1',
      voteId
    });
    expect(pageVoteNotificationUrl).toBe(`/page-1?voteId=${voteId}`);
  });
});
