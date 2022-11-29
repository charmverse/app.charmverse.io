import type { PostCategory } from '@prisma/client';

import * as http from 'adapters/http';
import type { ForumPost } from 'lib/forum/interfaces';
import type { CreatePostCategoryInput } from 'lib/posts/createPostCategory';
import type { PostCategoryUpdate } from 'lib/posts/updatePostCategory';

export class ForumApi {
  listForumPosts(
    spaceId: string,
    sort?: string,
    category?: string,
    count?: number,
    page?: number
  ): Promise<ForumPost[]> {
    return http.GET('/api/forum/posts', { spaceId, sort, category, count, page });
  }

  listPostCategories(spaceId: string): Promise<PostCategory[]> {
    return http.GET(`/api/spaces/${spaceId}/post-categories`);
  }

  createPostCategory(spaceId: string, category: CreatePostCategoryInput): Promise<PostCategory> {
    return http.POST(`/api/spaces/${spaceId}/post-categories`, category);
  }

  updatePostCategory({
    spaceId,
    id,
    color,
    name
  }: PostCategoryUpdate & Pick<PostCategory, 'spaceId' | 'id'>): Promise<PostCategory> {
    return http.PUT(`/api/spaces/${spaceId}/post-categories/${id}`, { color, name });
  }

  deletePostCategory({ id, spaceId }: Pick<PostCategory, 'spaceId' | 'id'>): Promise<void> {
    return http.GET(`/api/spaces/${spaceId}/post-categories/${id}`);
  }
}
