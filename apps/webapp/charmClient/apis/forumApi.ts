import type { Post, PostCategory, PostComment, Space } from '@charmverse/core/prisma';
import * as http from '@packages/adapters/http';
import type { PageMeta } from '@packages/core/pages';
import type { PostCategoryWithPermissions } from '@packages/core/permissions';
import type { CreatePostCategoryInput } from '@packages/lib/forums/categories/createPostCategory';
import type { PostCategoryUpdate } from '@packages/lib/forums/categories/updatePostCategory';
import type {
  CreatePostCommentInput,
  PostCommentWithVote,
  UpdatePostCommentInput
} from '@packages/lib/forums/comments/interface';
import type { CreateForumPostInput } from '@packages/lib/forums/posts/createForumPost';
import type { PostWithVotes } from '@packages/lib/forums/posts/interfaces';
import type { ListDraftPostsRequest } from '@packages/lib/forums/posts/listDraftPosts';
import type { ListForumPostsRequest, PaginatedPostList } from '@packages/lib/forums/posts/listForumPosts';
import type { SearchForumPostsRequest } from '@packages/lib/forums/posts/searchForumPosts';
import type { UpdateForumPostInput } from '@packages/lib/forums/posts/updateForumPost';

export class ForumApi {
  createForumPost(payload: Omit<CreateForumPostInput, 'createdBy'>) {
    return http.POST<Post>(`/api/forums/posts`, payload);
  }

  listForumPosts({ spaceId, count, page, sort, categoryId }: ListForumPostsRequest): Promise<PaginatedPostList> {
    return http.GET('/api/forums/posts', { spaceId, sort, categoryId, count, page });
  }

  listDraftPosts({ spaceId }: Omit<ListDraftPostsRequest, 'userId'>): Promise<Post[]> {
    return http.GET('/api/forums/posts/drafts', { spaceId });
  }

  searchForumPosts(searchQuery: SearchForumPostsRequest): Promise<PaginatedPostList> {
    return http.POST('/api/forums/posts/search', searchQuery);
  }

  updateForumPost(postId: string, payload: UpdateForumPostInput) {
    return http.PUT(`/api/forums/posts/${postId}`, payload);
  }

  deleteForumPost(postId: string) {
    return http.DELETE(`/api/forums/posts/${postId}`);
  }

  getForumPost({ postIdOrPath, spaceDomain }: { postIdOrPath: string; spaceDomain?: string }) {
    return http.GET<PostWithVotes>(
      `/api/forums/posts/${postIdOrPath}${spaceDomain ? `?spaceDomain=${spaceDomain}` : ''}`
    );
  }

  listPostCategories(spaceId: string): Promise<PostCategoryWithPermissions[]> {
    return http.GET(`/api/spaces/${spaceId}/post-categories`);
  }

  listPostComments(postId: string): Promise<PostCommentWithVote[]> {
    return http.GET(`/api/forums/posts/${postId}/comments`);
  }

  createPostComment(postId: string, body: CreatePostCommentInput): Promise<PostCommentWithVote> {
    return http.POST(`/api/forums/posts/${postId}/comments`, body);
  }

  createPostCategory(spaceId: string, category: CreatePostCategoryInput): Promise<PostCategoryWithPermissions> {
    return http.POST(`/api/spaces/${spaceId}/post-categories`, category);
  }

  setDefaultPostCategory({ spaceId, postCategoryId }: { spaceId: string; postCategoryId: string }): Promise<Space> {
    return http.POST(`/api/spaces/${spaceId}/set-default-post-category`, {
      postCategoryId
    });
  }

  updatePostCategory({
    spaceId,
    id,
    name,
    description
  }: PostCategoryUpdate & Pick<PostCategory, 'spaceId' | 'id'>): Promise<PostCategoryWithPermissions> {
    return http.PUT(`/api/spaces/${spaceId}/post-categories/${id}`, { name, description });
  }

  updatePostComment({
    postId,
    commentId,
    ...body
  }: UpdatePostCommentInput & { postId: string; commentId: string }): Promise<PostComment> {
    return http.PUT(`/api/forums/posts/${postId}/comments/${commentId}`, body);
  }

  deletePostCategory({ id, spaceId }: Pick<PostCategory, 'spaceId' | 'id'>): Promise<void> {
    return http.DELETE(`/api/spaces/${spaceId}/post-categories/${id}`);
  }

  voteOnPost({ postId, upvoted }: { upvoted: boolean | null; postId: string }) {
    return http.PUT(`/api/forums/posts/${postId}/vote`, { upvoted });
  }

  upOrDownVoteComment({ postId, upvoted, commentId }: { commentId: string; upvoted: boolean | null; postId: string }) {
    return http.PUT(`/api/forums/posts/${postId}/comments/${commentId}/vote`, { upvoted });
  }

  deletePostComment({ commentId, postId }: { postId: string; commentId: string }): Promise<void> {
    return http.DELETE(`/api/forums/posts/${postId}/comments/${commentId}`);
  }
}
