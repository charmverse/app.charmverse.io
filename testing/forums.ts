import type { Prisma } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import type { ForumPostPage } from 'lib/forums/posts/interfaces';

export async function generateForumPosts({
  count,
  spaceId,
  createdBy,
  categoryId,
  content = { type: 'doc', content: [] },
  contentText = '',
  galleryImage
}: {
  spaceId: string;
  createdBy: string;
  count: number;
  categoryId?: string;
  content?: any;
  contentText?: string;
  galleryImage?: string;
}): Promise<ForumPostPage[]> {
  const postCreateInputs: Prisma.PostCreateManyInput[] = [];
  const pageCreateInputs: Prisma.PageCreateManyInput[] = [];

  // Start creating the posts 3 days ago
  let createdAt = Date.now() - 1000 * 60 * 60 * 24 * 30;

  for (let i = 0; i < count; i++) {
    const postInput: Prisma.PostCreateManyInput = {
      status: 'published',
      categoryId,
      id: v4()
    };

    postCreateInputs.push(postInput);

    const postDate = new Date(createdAt);

    pageCreateInputs.push({
      id: postInput.id,
      spaceId,
      contentText,
      content,
      title: `Post ${i}`,
      createdBy,
      updatedBy: createdBy,
      type: 'post',
      path: `path-${v4()}`,
      postId: postInput.id,
      galleryImage,
      createdAt: postDate,
      updatedAt: postDate
    });

    // Space posts apart by 30 minutes
    createdAt += 1000 * 60 * 30;
  }

  await prisma.post.createMany({ data: postCreateInputs });
  await prisma.page.createMany({ data: pageCreateInputs });

  return prisma.page.findMany({
    where: {
      spaceId,
      type: 'post',
      postId: {
        in: postCreateInputs.map((post) => post.id as string)
      }
    },
    include: {
      post: true
    }
  }) as Promise<ForumPostPage[]>;
}
