// import type { Block } from '@charmverse/core/prisma';

import type { PageMeta } from '@charmverse/core/pages';
import type { Page, Prisma, SubscriptionTier } from '@charmverse/core/prisma';
import type { Server, Socket } from 'socket.io';

import type { Block } from 'lib/focalboard/block';
import type { FailedImportsError } from 'lib/notion/types';
import type { ExtendedVote, VoteTask } from 'lib/votes/interfaces';

export type Resource = { id: string };
export type ResourceWithSpaceId = Resource & { spaceId: string };

export type SealedUserId = {
  userId: string;
};

export type SocketAuthResponse = {
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
  // we use the full Page interface so that we can pass other fields for individual page views
  payload: (Partial<Page> & ResourceWithSpaceId)[];
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
  } & SocketAuthResponse;
};

type PageDeleted = {
  type: 'page_deleted';
  payload: Resource;
};

type PageRestored = {
  type: 'page_restored';
  payload: Resource;
};

export type PageCreated = {
  type: 'page_created';
  payload: Partial<Prisma.PageUncheckedCreateInput> &
    Pick<
      Prisma.PageUncheckedCreateInput,
      'boardId' | 'content' | 'contentText' | 'path' | 'title' | 'type' | 'spaceId'
    >;
};

type PageReordered = {
  type: 'page_reordered';
  payload: {
    pageId: string;
    newParentId: string | null;
    newIndex: number;
    trigger: 'sidebar-to-sidebar' | 'sidebar-to-editor' | 'editor-to-editor';
    dropPos?: number;
    isLinkedPage?: boolean;
    dragPos?: number;
    currentParentId?: string | null;
  };
};

type SpaceSubscriptionUpdated = {
  type: 'space_subscription';
  payload: {
    type: 'activated' | 'cancelled' | 'updated';
    paidTier: SubscriptionTier | null;
  };
};

export type NotionImportCompleted = {
  type: 'notion_import_completed';
  payload: {
    totalImportedPages: number;
    totalPages: number;
    failedImports: FailedImportsError[];
  };
};

type ThreadsUpdated = {
  type: 'threads_updated';
  payload: {
    threadId: string;
    pageId: string;
  };
};

type PagesRestored = {
  type: 'pages_restored';
  payload: Resource[];
};

export type ClientMessage = SubscribeToWorkspace | PageDeleted | PageRestored | PageCreated | PageReordered;

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
  | PostDeleted
  | ThreadsUpdated
  | SpaceSubscriptionUpdated
  | NotionImportCompleted
  | PagesRestored;

export type WebSocketMessage = ClientMessage | ServerMessage;

export type WebSocketPayload<T extends WebSocketMessage['type']> = Extract<WebSocketMessage, { type: T }>['payload'];

export type AbstractWebsocketBroadcaster = {
  sockets: Record<string, Socket>;

  bindServer(io: Server): Promise<void>;

  broadcastToAll(message: ServerMessage): void;

  broadcast(message: ServerMessage, roomId: string): void;

  leaveRoom(socket: Socket, roomId: string): void;

  registerWorkspaceSubscriber(args: { userId: string; socket: Socket; roomId: string }): Promise<void>;

  close(): void;
};
