import type { Block } from '@prisma/client';

import type { PageMeta } from 'lib/pages';
import type { SystemError } from 'lib/utilities/errors';

export const WebsocketEvents = ['block_updated', 'blocks_created', 'page_meta_updated', 'pages_created', 'subscribe', 'error'] as const;

export type WebsocketEvent = typeof WebsocketEvents[number]

export type Resource = { id: string }
export type ResourceWithSpaceId = Resource & { spaceId: string }

// List of event payloads
export type BlockUpdate = Partial<Block> & ResourceWithSpaceId

export type PageMetaUpdate = Partial<PageMeta> & ResourceWithSpaceId

export type SubscribeRequest = {
  spaceId: string;
}

// Map of event type to event payload
export type Updates = {
  block_updated: BlockUpdate;
  blocks_created: Block[];
  page_meta_updated: PageMetaUpdate;
  pages_created: PageMeta[];
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
