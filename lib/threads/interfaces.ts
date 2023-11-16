import { type Thread, type Comment, Prisma } from '@charmverse/core/prisma';

import type { PageContent } from 'lib/prosemirror/interfaces';

export enum ThreadStatus {
  open,
  closed
}

export type ThreadStatusType = keyof typeof ThreadStatus;

export interface ThreadStatusUpdate {
  id: string;
  status: ThreadStatusType;
}

export interface ThreadAccessGroup {
  id: string;
  group: 'user' | 'role';
}

/**
 * @context Prosemirror content for knowing where to display this thread inside the CharmEditor
 */
export interface ThreadCreatePayload {
  comment: string | PageContent;
  pageId: string;
  userId: string;
  context: string;
  accessGroups?: ThreadAccessGroup[];
}

export interface ThreadWithComments extends Thread {
  comments: Comment[];
}

export interface ThreadWithCommentsAndAuthors extends Thread {
  comments: Comment[];
}

export interface MultipleThreadsInput {
  threadIds: string[];
  pageId: string;
}
