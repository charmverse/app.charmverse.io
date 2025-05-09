import type { Comment, Prisma } from '@charmverse/core/prisma';
import type { PageContent } from '@packages/charmeditor/interfaces';
import type { UserPermissionFlags } from '@packages/lib/permissions/interfaces';

export type CommentCreate = Pick<Comment, 'content' | 'threadId' | 'userId'>;

export type CommentUpdate = Pick<Comment, 'content' | 'id'>;

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
  lensCommentLink?: string | null;
};

export type GenericCommentWithVote<T = object> = GenericComment<T> & GenericCommentVote;
export type CommentWithChildren<T = object> = (GenericComment<T> | GenericCommentWithVote<T>) & {
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

export type UpdateCommentInput = Partial<CommentContent> & {
  lensCommentLink?: string;
};

export type CommentOperations = 'add_comment' | 'delete_comments' | 'upvote' | 'downvote';

export type CommentPermissions = UserPermissionFlags<CommentOperations>;
