import type { Prisma } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import type { ForumPostPage } from 'lib/forums/posts/interfaces';

export async function generateForumPosts({
  count,
  spaceId,
  createdBy,
  categoryId,
  content
}: {
  spaceId: string;
  createdBy: string;
  count: number;
  categoryId?: string;
  content?: any;
}): Promise<ForumPostPage[]> {
  const postCreateInputs: Prisma.PostCreateManyInput[] = [];
  const pageCreateInputs: Prisma.PageCreateManyInput[] = [];

  for (let i = 0; i < count; i++) {
    const postInput: Prisma.PostCreateManyInput = {
      status: 'published',
      categoryId,
      id: v4()
    };

    postCreateInputs.push(postInput);

    pageCreateInputs.push({
      id: postInput.id,
      spaceId,
      contentText: '',
      content,
      title: `Post ${i}`,
      createdBy,
      updatedBy: createdBy,
      type: 'post',
      path: `-${v4()}`,
      postId: postInput.id
    });
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
