import type { Page, Post } from '@prisma/client';

export type ForumPostContent = {
  type: 'text' | 'image';
  content: string;
};
export type ForumPostPage = Page & { post: Post };
