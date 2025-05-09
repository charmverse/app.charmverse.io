// import type { Block } from '@charmverse/core/prisma';

import type { PageMeta } from '@charmverse/core/pages';
import type { Page, PageType, Prisma, SubscriptionTier } from '@charmverse/core/prisma';
import type { UIBlockWithDetails } from '@packages/databases/block';
import type { ProposalWithUsersLite } from '@packages/lib/proposals/getProposals';
import type { RewardBlockWithTypedFields } from '@packages/lib/rewards/blocks/interfaces';
import type { ExtendedVote, VoteTask } from '@packages/lib/votes/interfaces';
import type { Server, Socket } from 'socket.io';

// copied from lib/notion/interfaces to avoid recursive dependency
interface FailedImportsError {
  pageId: string;
  type: 'page' | 'database';
  title: string;
  blocks: [string, string][];
}

export type Resource<T = object> = { id: string } & T;
export type ResourceWithSpaceId = Resource<{ spaceId: string }>;

export type SealedUserId = {
  userId: string;
};

export type SocketAuthResponse = {
  authToken: string;
};

type BlocksUpdated = {
  type: 'blocks_updated';
  payload: (Partial<UIBlockWithDetails> & ResourceWithSpaceId)[];
};

type RewardBlocksUpdated = {
  type: 'reward_blocks_updated';
  payload: RewardBlockWithTypedFields[];
};

type BlocksCreated = {
  type: 'blocks_created';
  payload: UIBlockWithDetails[];
};

type BlocksDeleted = {
  type: 'blocks_deleted';
  payload: Resource[];
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
  payload: Resource<{
    categoryId: string;
    createdBy: string;
  }>;
};

type PostDeleted = {
  type: 'post_deleted';
  payload: Resource<{ categoryId: string }>;
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

type PageReorderedSidebarToSidebar = {
  type: 'page_reordered_sidebar_to_sidebar';
  payload: {
    pageId: string;
    newParentId: string | null;
  };
};

type PageReorderedSidebarToEditor = {
  type: 'page_reordered_sidebar_to_editor';
  payload: {
    pageId: string;
    newParentId: string;
    dropPos: number | null;
  };
};

type PageReorderedEditorToEditor = {
  type: 'page_reordered_editor_to_editor';
  payload: {
    pageId: string;
    newParentId: string;
    draggedNode: {
      type: string;
      attrs?: Record<string, any>;
    };
    dragNodePos: number;
    currentParentId: string;
  };
};

type PageDuplicated = {
  type: 'page_duplicated';
  payload: {
    pageId: string;
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

type ProposalsUpdated = {
  type: 'proposals_updated';
  payload: Resource<Partial<Pick<ProposalWithUsersLite, 'archived' | 'currentStep'>>>[];
};

export type ClientMessage =
  | SubscribeToWorkspace
  | PageDeleted
  | PageRestored
  | PageCreated
  | PageReorderedSidebarToSidebar
  | PageReorderedSidebarToEditor
  | PageReorderedEditorToEditor
  | PageDuplicated;

export type ServerMessage =
  | RewardBlocksUpdated
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
  | PagesRestored
  | ProposalsUpdated;

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
