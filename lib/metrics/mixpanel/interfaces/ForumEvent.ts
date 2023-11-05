import type { BaseEvent } from './BaseEvent';
import type { ResourceEvent } from './ResourceEvent';

type PostEvent = BaseEvent & ResourceEvent;

type MainFeedFilteredEvent = BaseEvent & {
  categoryName: string;
};

type PostCreateEvent = PostEvent & {
  categoryName: string;
  hasImage: boolean;
  isDraft: boolean;
};

type PostDeleteEvent = PostEvent & {
  categoryName: string;
  hasImage: string;
};

type PostVoteEvent = PostEvent & {
  categoryName: string;
};

type CommentVoteEvent = PostEvent & {
  categoryName: string;
  postId: string;
};

type CommentCreateEvent = PostEvent & {
  categoryName: string;
  postId: string;
  commentedOn: 'post' | 'comment';
};

export interface ForumEventMap {
  main_feed_filtered: MainFeedFilteredEvent;
  create_a_post: PostCreateEvent;
  // TODO: Deleting a forum post not available yet
  delete_a_post: PostDeleteEvent;
  upvote_post: PostVoteEvent;
  downvote_post: PostVoteEvent;
  upvote_comment: CommentVoteEvent;
  downvote_comment: CommentVoteEvent;
  create_comment: CommentCreateEvent;
  delete_comment: CommentCreateEvent;
}
