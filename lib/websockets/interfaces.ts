import type { Block } from '@prisma/client';

import type { PageMeta } from 'lib/pages';

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

type ErrorMessage = {
  type: 'error';
  payload: string;
}

type SubscribeToWorkspace = {
  type: 'subscribe';
  payload: {
    spaceId: string;
  } & SocketAuthReponse;
};

export type ClientMessage = SubscribeToWorkspace;

export type ServerMessage = BlocksUpdated
  | BlocksCreated
  | BlocksDeleted
  | PagesMetaUpdated
  | PagesCreated
  | PagesDeleted
  | ErrorMessage;

export type WebSocketMessage = ClientMessage | ServerMessage;

export type WebSocketPayload<T extends WebSocketMessage['type']> = Extract<WebSocketMessage, { type: T }>['payload'];
