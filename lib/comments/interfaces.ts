import type { Comment, User } from '@prisma/client';

export type CommentCreate = Pick<Comment, 'content' | 'threadId' | 'userId'>

export type CommentUpdate = Pick<Comment, 'content' | 'id'>

export interface CommentWithUser extends Comment {
  user: User;
}
