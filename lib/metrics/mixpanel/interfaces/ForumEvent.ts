import type { BaseEvent } from './BaseEvent';
import type { ResourceEvent } from './ResourceEvent';

type PostEvent = BaseEvent & ResourceEvent;

export interface PostPageLoadEvent extends PostEvent {}

export interface MainFeedLoadEvent {
  spaceId: string;
  userId: string;
}

export interface MainFeedFilteredEvent {
  spaceId: string;
  userId: string;
  categoryName: string;
}

export interface PostCreateEvent extends PostEvent {
  categoryName: string;
  hasImage: boolean;
}

export interface PostDeleteEvent extends PostEvent {
  categoryName: string;
  hasImage: string;
}

export interface PostVoteEvent extends PostEvent {
  categoryName: string;
}

export interface CommentVoteEvent extends PostEvent {
  categoryName: string;
  postId: string;
}

export interface CommentCreateEvent extends PostEvent {
  categoryName: string;
  postId: string;
  commentedOn: 'post' | 'comment';
}

export interface ForumEventMap {
  main_feed_page_load: MainFeedLoadEvent;
  main_feed_filtered: MainFeedFilteredEvent;
  load_post_page: PostPageLoadEvent;
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
