import type { WebhookEventNames } from 'lib/webhook/interfaces';

import { getUserEntity, getCommentEntity, getSpaceEntity, getPostEntity } from './entities';
import { publishWebhookEvent } from './publisher';

type DiscussionEventContext = {
  scope: WebhookEventNames.DiscussionCreated;
  spaceId: string;
  postId: string;
};

export async function publishPostEvent({ scope, spaceId, postId }: DiscussionEventContext) {
  const [post, space] = await Promise.all([getPostEntity(postId), getSpaceEntity(spaceId)]);
  return publishWebhookEvent(spaceId, {
    scope,
    space,
    discussion: post
  });
}

type CommentEventContext = {
  scope: WebhookEventNames.CommentCreated;
  spaceId: string;
  postId: string;
  commentId: string;
};

export async function publishPostCommentEvent({ scope, spaceId, commentId, postId }: CommentEventContext) {
  const [post, comment, space] = await Promise.all([
    getPostEntity(postId),
    getCommentEntity(commentId),
    getSpaceEntity(spaceId)
  ]);
  return publishWebhookEvent(spaceId, {
    scope,
    space,
    comment,
    discussion: post
  });
}

type CommentVoteEventContext = {
  scope: WebhookEventNames.CommentDownvoted | WebhookEventNames.CommentUpvoted;
  spaceId: string;
  postId: string;
  commentId: string;
  voterId: string;
};

export async function publishPostCommentVoteEvent({
  scope,
  spaceId,
  commentId,
  postId,
  voterId
}: CommentVoteEventContext) {
  const [discussion, comment, space, voter] = await Promise.all([
    getPostEntity(postId),
    getCommentEntity(commentId),
    getSpaceEntity(spaceId),
    getUserEntity(voterId)
  ]);
  return publishWebhookEvent(spaceId, {
    scope,
    space,
    comment,
    discussion,
    voter
  });
}

type MemberEventContext = {
  scope: WebhookEventNames.MemberJoined;
  spaceId: string;
  userId: string;
};

export async function publishMemberEvent({ scope, spaceId, userId }: MemberEventContext) {
  const [space, user] = await Promise.all([getSpaceEntity(spaceId), getUserEntity(userId)]);
  return publishWebhookEvent(spaceId, {
    scope,
    space,
    user
  });
}
