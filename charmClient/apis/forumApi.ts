import type { PageComment, PostCategory } from '@prisma/client';

import * as http from 'adapters/http';
import type { CreatePostCategoryInput } from 'lib/forums/categories/createPostCategory';
import type { PostCategoryUpdate } from 'lib/forums/categories/updatePostCategory';
import type {
  CreatePostCommentInput,
  PostCommentWithVote,
  UpdatePostCommentInput
} from 'lib/forums/comments/interface';
import type { ForumPostPageVote } from 'lib/forums/posts/interfaces';
import type { ListForumPostsRequest, PaginatedPostList } from 'lib/forums/posts/listForumPosts';

export class ForumApi {
  listForumPosts({ spaceId, count, page, sort, categoryIds }: ListForumPostsRequest): Promise<PaginatedPostList> {
    return http.GET('/api/forums/posts', { spaceId, sort, categoryIds, count, page });
  }

  listPostCategories(spaceId: string): Promise<PostCategory[]> {
    return http.GET(`/api/spaces/${spaceId}/post-categories`);
  }

  listPostComments(postId: string): Promise<PostCommentWithVote[]> {
    return http.GET(`/api/forums/posts/${postId}/comments`);
  }

  createPostComment(postId: string, body: CreatePostCommentInput): Promise<PostCommentWithVote> {
    return http.POST(`/api/forums/posts/${postId}/comments`, body);
  }

  createPostCategory(spaceId: string, category: CreatePostCategoryInput): Promise<PostCategory> {
    return http.POST(`/api/spaces/${spaceId}/post-categories`, category);
  }

  updatePostCategory({
    spaceId,
    id,
    name
  }: PostCategoryUpdate & Pick<PostCategory, 'spaceId' | 'id'>): Promise<PostCategory> {
    return http.PUT(`/api/spaces/${spaceId}/post-categories/${id}`, { name });
  }

  updatePostComment({
    postId,
    commentId,
    ...body
  }: UpdatePostCommentInput & { postId: string; commentId: string }): Promise<PageComment> {
    return http.PUT(`/api/forums/posts/${postId}/comments/${commentId}`, body);
  }

  deletePostCategory({ id, spaceId }: Pick<PostCategory, 'spaceId' | 'id'>): Promise<void> {
    return http.DELETE(`/api/spaces/${spaceId}/post-categories/${id}`);
  }

  votePost({ postId, upvoted }: { upvoted?: boolean; postId: string }) {
    return http.PUT(`/api/forums/posts/${postId}/vote`, { upvoted });
  }

  deletePostComment({ commentId, postId }: { postId: string; commentId: string }): Promise<void> {
    return http.DELETE(`/api/forums/posts/${postId}/comments/${commentId}`);
  }
}
