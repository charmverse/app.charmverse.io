import type { PageComment } from '@prisma/client';

import * as http from 'adapters/http';
import type { CreateApplicationCommentPayload } from 'lib/applications/interfaces';

export class ApplicationCommentsApi {
  addComment(applicationId: string, payload: CreateApplicationCommentPayload) {
    return http.POST<PageComment>(`/api/applications/${applicationId}/comments`, payload);
  }

  deleteComment(applicationId: string, pageCommentId: string) {
    return http.DELETE(`/api/applications/${applicationId}/comments/${pageCommentId}`);
  }

  editComment(applicationId: string, pageCommentId: string, payload: CreateApplicationCommentPayload) {
    return http.PUT<PageComment>(`/api/applications/${applicationId}/comments/${pageCommentId}`, payload);
  }

  getComments(applicationId: string) {
    return http.GET<PageComment[]>(`/api/applications/${applicationId}/comments`);
  }
}
