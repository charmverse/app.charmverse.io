import type { Block } from '@prisma/client';

import type { PageMeta } from 'lib/pages';
import type { SystemError } from 'lib/utilities/errors';

export const WebsocketEvents = ['blocks_updated', 'blocks_created', 'blocks_deleted', 'pages_meta_updated', 'pages_created', 'pages_deleted', 'subscribe', 'error'] as const;

export type WebsocketEvent = typeof WebsocketEvents[number]

export type Resource = { id: string }
export type ResourceWithSpaceId = Resource & { spaceId: string }

// List of event payloads
export type BlockUpdate = Partial<Block> & ResourceWithSpaceId

export type BlockDelete = Resource & Pick<Block, 'type'>;

export type PageMetaUpdate = Partial<PageMeta> & ResourceWithSpaceId

export type SocketAuthReponse = {
  authToken: string;
}

export type SubscribeRequest = {
  spaceId: string;
} & SocketAuthReponse

// Map of event type to event payload
export type Updates = {
  blocks_updated: BlockUpdate[];
  blocks_created: Block[];
  blocks_deleted: BlockDelete[];
  pages_meta_updated: PageMetaUpdate[];
  pages_created: PageMeta[];
  pages_deleted: Resource[];
  subscribe: SubscribeRequest;
  error: SystemError;
}

export type WebsocketPayload<T extends WebsocketEvent = WebsocketEvent> = Updates[T]

export type WebsocketMessage<T extends WebsocketEvent = WebsocketEvent> = {
  type: T;
  payload: WebsocketPayload<T>;
}

export type WebsocketSubscriber = {
  userId: string;
}
