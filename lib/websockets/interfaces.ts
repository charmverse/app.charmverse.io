// import type { Block } from '@charmverse/core/dist/prisma';

import type { Block } from 'lib/focalboard/block';
import type { PageMeta } from 'lib/pages';
import type { ExtendedVote, VoteTask } from 'lib/votes/interfaces';

export type Resource = { id: string };
export type ResourceWithSpaceId = Resource & { spaceId: string };

export type SealedUserId = {
  userId: string;
};

export type SocketAuthReponse = {
  authToken: string;
};

type BlocksUpdated = {
  type: 'blocks_updated';
  payload: (Partial<Block> & ResourceWithSpaceId)[];
};

type BlocksCreated = {
  type: 'blocks_created';
  payload: Block[];
};

type BlocksDeleted = {
  type: 'blocks_deleted';
  payload: (Resource & Pick<Block, 'type'>)[];
};

type PagesMetaUpdated = {
  type: 'pages_meta_updated';
  payload: (Partial<PageMeta> & ResourceWithSpaceId)[];
};

type PagesCreated = {
  type: 'pages_created';
  payload: PageMeta[];
};

type PagesDeleted = {
  type: 'pages_deleted';
  payload: Resource[];
};

type VotesCreated = {
  type: 'votes_created';
  // We need a VoteTask, not just an extended vote, so this can be passed to the users' tasks, which will span different spaces
  payload: VoteTask[];
};

type VotesDeleted = {
  type: 'votes_deleted';
  payload: Resource[];
};

type VotesUpdated = {
  type: 'votes_updated';
  payload: ExtendedVote[];
};

type PostPublished = {
  type: 'post_published';
  payload: {
    categoryId: string;
    createdBy: string;
  };
};

type PostUpdated = {
  type: 'post_updated';
  payload: {
    id: string;
    categoryId: string;
    createdBy: string;
  };
};

type PostDeleted = {
  type: 'post_deleted';
  payload: {
    categoryId: string;
    id: string;
  };
};

type ErrorMessage = {
  type: 'error';
  payload: string;
};

type SubscribeToWorkspace = {
  type: 'subscribe';
  payload: {
    spaceId: string;
  } & SocketAuthReponse;
};

export type ClientMessage = SubscribeToWorkspace;

export type ServerMessage =
  | BlocksUpdated
  | BlocksCreated
  | BlocksDeleted
  | PagesMetaUpdated
  | PagesCreated
  | PagesDeleted
  | ErrorMessage
  | VotesCreated
  | VotesDeleted
  | VotesUpdated
  | PostPublished
  | PostUpdated
  | PostDeleted;

export type WebSocketMessage = ClientMessage | ServerMessage;

export type WebSocketPayload<T extends WebSocketMessage['type']> = Extract<WebSocketMessage, { type: T }>['payload'];
