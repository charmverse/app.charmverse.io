import type { FormFieldAnswer, Thread, Comment } from '@charmverse/core/prisma';
import type { PageContent } from '@packages/charmeditor/interfaces';

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
  fieldAnswerId?: string;
}

export interface ThreadWithComments extends Omit<Thread, 'accessGroups'> {
  comments: Comment[];
  accessGroups: ThreadAccessGroup[];
  fieldAnswer?: Pick<FormFieldAnswer, 'fieldId' | 'id' | 'proposalId'>;
}

export interface MultipleThreadsInput {
  threadIds: string[];
  pageId: string;
}
