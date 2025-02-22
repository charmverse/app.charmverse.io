import type { PostCategory } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getPostCategoryPath } from '@root/lib/forums/categories/getPostCategoryPath';
import { createPostComment } from '@root/lib/forums/comments/createPostComment';
import type { CreatePostCommentInput } from '@root/lib/forums/comments/interface';
import { upsertPostCategoryPermission } from '@root/lib/permissions/forum/upsertPostCategoryPermission';
import { v4 } from 'uuid';

export async function generatePostCategory({
  spaceId,
  name = `Category-${Math.random()}`,
  fullAccess
}: {
  spaceId: string;
  name?: string;
  fullAccess?: boolean;
}): Promise<Required<PostCategory>> {
  const category = await prisma.postCategory.create({
    data: {
      name,
      spaceId,
      path: getPostCategoryPath(name)
    }
  });
  if (fullAccess) {
    // Allow the entire space to create posts and participate in this category
    await upsertPostCategoryPermission({
      assignee: { group: 'space', id: spaceId },
      permissionLevel: 'full_access',
      postCategoryId: category.id
    });
  }
  return category;
}

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

  const postComment = await createPostComment({
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
  isDraft
}: {
  isDraft?: boolean;
  categoryId?: string;
  userId: string;
  spaceId: string;
  path?: string;
  title?: string;
  content?: any;
  contentText?: string;
}) {
  if (!categoryId) {
    const category = await generatePostCategory({ spaceId });
    categoryId = category.id;
  }
  return prisma.post.create({
    data: {
      title,
      path,
      contentText: contentText ?? '',
      isDraft,
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
