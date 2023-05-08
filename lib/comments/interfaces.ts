import type { Comment, User, Prisma } from '@charmverse/core/prisma';

import type { UserPermissionFlags } from 'lib/permissions/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';

export type CommentCreate = Pick<Comment, 'content' | 'threadId' | 'userId'>;

export type CommentUpdate = Pick<Comment, 'content' | 'id'>;

export interface CommentWithUser extends Comment {
  user: { id: string; username: string; avatar: string };
}

export type GenericCommentVote = {
  upvotes: number;
  downvotes: number;
  upvoted: null | boolean;
};

export type GenericComment<T = object> = T & {
  id: string;
  createdAt: Date;
  createdBy: string;
  content: Prisma.JsonValue;
  contentText: string;
  updatedAt?: Date | null;
  deletedAt: Date | null;
  deletedBy: string | null;
  parentId: string | null;
};

export type GenericCommentWithVote<T = object> = GenericComment<T> & GenericCommentVote;
export type CommentWithChildren<T = object> = GenericCommentWithVote<T> & {
  children: CommentWithChildren<T>[];
};

export type CommentContent = {
  content: PageContent;
  contentText: string;
};

export type CreateCommentInput = {
  content: PageContent;
  contentText: string;
  parentId?: string;
};

export type UpdateCommentInput = CommentContent;

export type CommentOperations = 'add_comment' | 'delete_comments' | 'upvote' | 'downvote';

export type CommentPermissions = UserPermissionFlags<CommentOperations>;
