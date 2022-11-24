import type { User } from '@prisma/client';

export interface ForumPostContent {
  type: 'text' | 'image';
  content: string;
}

export interface ForumPost {
  id: string;
  title: string;
  content: ForumPostContent;
  user: Omit<User, 'addresses'>;
  upVotes: number;
  downVotes: number;
  commentsNumber: number;
  updatedAt: Date;
  createdAt: Date;
}
