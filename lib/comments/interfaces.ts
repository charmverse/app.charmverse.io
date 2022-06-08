import { Comment, User } from '@prisma/client';

export type CommentUpdate = Pick<Comment, 'content' | 'id'>

export interface CommentWithUser extends Comment {
  user: User
}
