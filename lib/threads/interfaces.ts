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

export interface ThreadAccessGroup {
  id: string | null;
  group: 'space' | 'user' | 'role' | 'reviewers' | 'authors';
}

/**
 * @context Prosemirror content for knowing where to display this thread inside the CharmEditor
 */
export interface ThreadCreatePayload {
  comment: string | PageContent;
  pageId: string;
  userId: string;
  context: string;
  accessGroup: ThreadAccessGroup;
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
