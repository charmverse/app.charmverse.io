import type { Thread, Comment } from '@charmverse/core/prisma';

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

/**
 * @context Prosemirror content for knowing where to display this thread inside the CharmEditor
 */
export interface ThreadCreate {
  comment: string | PageContent;
  pageId: string;
  userId: string;
  context: string;
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
