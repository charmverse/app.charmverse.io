import type { PostCategory } from '@prisma/client';

import * as http from 'adapters/http';
import type { CreatePostCategoryInput } from 'lib/forums/categories/createPostCategory';
import type { PostCategoryUpdate } from 'lib/forums/categories/updatePostCategory';
import type { PaginatedPostList, ListForumPostsRequest } from 'lib/forums/posts/listForumPosts';

export class ForumApi {
  listForumPosts({ spaceId, count, page, sort, categoryIds }: ListForumPostsRequest): Promise<PaginatedPostList> {
    return http.GET('/api/forums/posts', { spaceId, sort, categoryIds, count, page });
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
