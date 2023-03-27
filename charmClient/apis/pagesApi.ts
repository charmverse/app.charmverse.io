import type { Page, PageComment, ProfileItem } from '@prisma/client';

import * as http from 'adapters/http';
import type { CreateCommentInput, UpdateCommentInput } from 'lib/comments';
import type { DuplicatePageResponse, IPageWithPermissions, PageDetails, PageMeta } from 'lib/pages';
import type { PageCommentWithVote } from 'lib/pages/comments/interface';

export interface UpdateProfileItemRequest {
  profileItems: Omit<ProfileItem, 'userId'>[];
}

export class PagesApi {
  getPages(spaceId: string) {
    return http.GET<PageMeta[]>(`/api/spaces/${spaceId}/pages`);
  }

  getArchivedPages(spaceId: string) {
    return http.GET<PageMeta[]>(`/api/spaces/${spaceId}/pages`, { archived: true });
  }

  searchPages(spaceId: string, search: string, limit?: number) {
    return http.GET<PageMeta[]>(`/api/spaces/${spaceId}/pages`, { search, limit });
  }

  getPage(pageIdOrPath: string, spaceId?: string) {
    const query = spaceId ? `?spaceId=${spaceId}` : '';
    return http.GET<IPageWithPermissions>(`/api/pages/${pageIdOrPath}${query}`);
  }

  updatePage(pageOpts: Partial<Page>) {
    return http.PUT<IPageWithPermissions>(`/api/pages/${pageOpts.id}`, pageOpts);
  }

  getPageDetails(pageIdOrPath: string, spaceId?: string) {
    const query = spaceId ? `?spaceId=${spaceId}` : '';
    return http.GET<PageDetails>(`/api/pages/${pageIdOrPath}/details${query}`);
  }

  convertToProposal({ pageId, categoryId }: { pageId: string; categoryId: string }) {
    return http.POST<PageMeta>(`/api/pages/${pageId}/convert-to-proposal`, { categoryId });
  }

  duplicatePage({ pageId }: { pageId: string }) {
    return http.POST<DuplicatePageResponse>(`/api/pages/${pageId}/duplicate`);
  }

  listComments(pageId: string): Promise<PageCommentWithVote[]> {
    return http.GET(`/api/pages/${pageId}/comments`);
  }

  createComment({ pageId, comment }: { pageId: string; comment: CreateCommentInput }): Promise<PageCommentWithVote> {
    return http.POST(`/api/pages/${pageId}/comments`, comment);
  }

  updateComment({
    pageId,
    id,
    content,
    contentText
  }: UpdateCommentInput & { pageId: string; id: string }): Promise<PageComment> {
    return http.PUT(`/api/pages/${pageId}/comments/${id}`, { content, contentText });
  }

  deleteComment({ commentId, pageId }: { pageId: string; commentId: string }): Promise<void> {
    return http.DELETE(`/api/pages/${pageId}/comments/${commentId}`);
  }

  voteComment({ pageId, upvoted, commentId }: { commentId: string; upvoted: boolean | null; pageId: string }) {
    return http.PUT(`/api/pages/${pageId}/comments/${commentId}/vote`, { upvoted });
  }
}
