import type { Block } from '@prisma/client';

import type { PageMeta } from 'lib/pages';
import type { SystemError } from 'lib/utilities/errors';

export const WebsocketEvents = ['block_updated', 'page_meta_updated', 'subscribe', 'error'] as const;

export type WebsocketEvent = typeof WebsocketEvents[number]

export type Resource = { id: string }
export type ResourceWithSpaceId = Resource & { spaceId: string }

// List of event payloads
export type BlockUpdate = Partial<Block> & ResourceWithSpaceId

export type PageMetaUpdate = Partial<PageMeta> & ResourceWithSpaceId

export type SubscribeRequest = {
  spaceId: string;
}

export type Updates = {
  block_updated: BlockUpdate;
  page_meta_updated: PageMetaUpdate;
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
