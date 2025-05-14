import type { PageMeta } from '@charmverse/core/pages';
import type { Page, PageComment, ProfileItem } from '@charmverse/core/prisma';
import * as http from '@packages/adapters/http';
import type { FilterGroup } from '@packages/databases/filterGroup';
import type { CreateCommentInput, UpdateCommentInput } from '@packages/lib/comments';

import type { PageCommentWithVote } from 'lib/pages/comments/interface';
import type { DuplicatePageResponse } from 'lib/pages/duplicatePage';
import type { PageWithContent } from 'lib/pages/interfaces';
import type { PageLockToggle, PageLockToggleResult } from 'lib/pages/togglePageLock';

export interface UpdateProfileItemRequest {
  profileItems: Omit<ProfileItem, 'userId'>[];
}

export class PagesApi {
  getPages({ spaceId }: { spaceId: string }) {
    return http.GET<PageMeta[]>(`/api/spaces/${spaceId}/pages`, { filter: 'sidebar_view' });
  }

  getArchivedPages(spaceId: string) {
    return http.GET<PageMeta[]>(`/api/spaces/${spaceId}/pages`, { archived: true });
  }

  getPage(pageId: string, spaceId?: string) {
    return http.GET<PageWithContent>(`/api/pages/${pageId}`, { spaceId });
  }

  updatePage(pageOpts: Partial<Page>) {
    return http.PUT<void>(`/api/pages/${pageOpts.id}`, pageOpts);
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
    contentText,
    lensCommentLink
  }: UpdateCommentInput & { pageId: string; id: string }): Promise<PageComment> {
    return http.PUT(`/api/pages/${pageId}/comments/${id}`, { content, contentText, lensCommentLink });
  }

  deleteComment({ commentId, pageId }: { pageId: string; commentId: string }): Promise<void> {
    return http.DELETE(`/api/pages/${pageId}/comments/${commentId}`);
  }

  voteComment({ pageId, upvoted, commentId }: { commentId: string; upvoted: boolean | null; pageId: string }) {
    return http.PUT(`/api/pages/${pageId}/comments/${commentId}/vote`, { upvoted });
  }

  syncPageCommentsWithLensPost({ pageId }: { pageId: string }): Promise<PageCommentWithVote[]> {
    return http.POST(`/api/pages/${pageId}/sync-page-comments`);
  }

  exportZippedDatabasePage({
    databaseId,
    filter,
    viewId
  }: {
    viewId?: string;
    databaseId: string;
    filter?: FilterGroup | null;
  }) {
    let customFilter = '';
    try {
      customFilter = JSON.stringify(filter);
    } catch (err) {
      //
    }

    return http.GET(
      `/api/pages/${databaseId}/export-database`,
      (filter && customFilter) || viewId ? { viewId, filter: customFilter } : undefined
    );
  }

  togglePageLock({ isLocked, pageId }: PageLockToggle): Promise<PageLockToggleResult> {
    return http.PUT(`/api/pages/${pageId}/toggle-lock`, { isLocked });
  }
}
