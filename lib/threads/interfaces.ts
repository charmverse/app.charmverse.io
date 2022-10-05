import type { Thread } from '@prisma/client';
import { Comment } from '@prisma/client';

import type { CommentWithUser } from 'lib/comments/interfaces';
import type { PageContent } from 'models';

export enum ThreadStatus {
  open,
  closed
}

export type ThreadStatusType = keyof typeof ThreadStatus

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

export interface ThreadWithCommentsAndAuthors extends Thread {
  comments: CommentWithUser[];
}

export interface MultipleThreadsInput {
  threadIds: string[];
  pageId: string;
}
