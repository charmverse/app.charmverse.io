import type { Post, PostCategory, PostComment, Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import type { PostCategoryPermissionAssignment } from '../permissions/forums/interfaces';

export async function generatePostCategory({
  spaceId,
  name = `Category-${Math.random()}`,
  permissions = []
}: {
  spaceId: string;
  name?: string;
  permissions?: Omit<PostCategoryPermissionAssignment, 'postCategoryId'>[];
}): Promise<Required<PostCategory>> {
  return prisma.postCategory.create({
    data: {
      name,
      spaceId,
      path: Math.random().toString(36).substring(2, 15),
      postCategoryPermissions: {
        createMany: {
          data: permissions.map((p) => ({
            permissionLevel: p.permissionLevel,
            roleId: p.assignee.group === 'role' ? p.assignee.id : undefined,
            spaceId: p.assignee.group === 'space' ? p.assignee.id : undefined,
            public: p.assignee.group === 'public' ? true : undefined
          }))
        }
      }
    }
  });
}

export type CreatePostCommentInput = {
  content: any;
  contentText: string;
  parentId?: string;
};

export async function generatePostWithComment({
  userId,
  spaceId,
  categoryId
}: {
  spaceId: string;
  userId: string;
  categoryId?: string;
}) {
  const commentInput: CreatePostCommentInput = {
    content: {
      type: ''
    },
    contentText: '',
    parentId: v4()
  };

  const post = await generateForumPost({
    spaceId,
    userId,
    categoryId
  });

  const postComment = await generatePostComment({
    ...commentInput,
    postId: post.id,
    userId
  });

  return {
    comment: postComment,
    post
  };
}

export async function generateForumPost({
  categoryId,
  userId,
  spaceId,
  path = `post-${v4()}`,
  title = 'Test post',
  content,
  contentText,
  isDraft,
  deletedAt
}: {
  categoryId?: string;
  userId: string;
  spaceId: string;
  path?: string;
  title?: string;
  content?: any;
  contentText?: string;
  isDraft?: boolean;
  deletedAt?: null | Date;
}) {
  if (!categoryId) {
    const category = await generatePostCategory({ spaceId });
    categoryId = category.id;
  }
  return prisma.post.create({
    data: {
      isDraft,
      title,
      path,
      deletedAt,
      contentText: contentText ?? '',
      content: content ?? {
        type: 'doc',
        content: []
      },
      space: {
        connect: {
          id: spaceId
        }
      },
      author: {
        connect: {
          id: userId
        }
      },
      category: {
        connect: {
          id: categoryId
        }
      }
    }
  });
}
export async function generatePostComment({
  content,
  contentText,
  parentId,
  postId,
  userId,
  deletedAt
}: Partial<CreatePostCommentInput> & {
  deletedAt?: Date;
  postId: string;
  userId: string;
}): Promise<PostComment> {
  const post = await prisma.post.findUniqueOrThrow({
    where: { id: postId },
    include: {
      category: true
    }
  });

  const comment = await prisma.postComment.create({
    data: {
      deletedAt,
      deletedBy: deletedAt ? userId : undefined,
      content,
      contentText: (contentText ?? '').trim(),
      parentId,
      user: {
        connect: {
          id: userId
        }
      },
      post: {
        connect: {
          id: postId
        }
      }
    }
  });

  return comment;
}
export async function generateForumPosts({
  categoryId,
  count,
  spaceId,
  createdBy,
  content = null,
  contentText = '',
  title,
  isDraft,
  withImageRatio = 30
}: {
  isDraft?: boolean;
  spaceId: string;
  categoryId?: string;
  createdBy: string;
  count: number;
  content?: any;
  contentText?: string;
  title?: string;
  withImageRatio?: number;
}): Promise<Post[]> {
  const postCreateInputs: Prisma.PostCreateManyInput[] = [];

  if (!categoryId) {
    const category = await prisma.postCategory.findFirst({
      where: {
        spaceId
      }
    });
    if (!category) {
      const newCategory = await generatePostCategory({ spaceId });
      categoryId = newCategory.id;
    } else {
      categoryId = category.id;
    }
  }

  // Start creating the posts 3 days ago
  let createdAt = Date.now() - 1000 * 60 * 60 * 24 * 30;

  for (let i = 0; i < count; i++) {
    const postDate = new Date(createdAt);

    postCreateInputs.push({
      id: v4(),
      spaceId,
      categoryId,
      contentText,
      content,
      title: `${title ?? 'Post'} ${i}`,
      createdBy,
      path: `path-${v4()}`,
      createdAt: postDate,
      updatedAt: postDate,
      isDraft
    });

    // Space posts apart by 30 minutes
    createdAt += 1000 * 60 * 30;
  }

  await prisma.post.createMany({ data: postCreateInputs });

  const posts = await prisma.post.findMany({
    where: {
      id: {
        in: postCreateInputs.map((post) => post.id as string)
      }
    }
  });
  return posts;
}
