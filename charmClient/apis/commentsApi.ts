import type { Comment } from '@charmverse/core/prisma';

import * as http from 'adapters/http';
import type { CommentCreate } from 'lib/comments/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { MultipleThreadsInput, ThreadWithComments } from 'lib/threads/interfaces';
import type { ResolveThreadRequest } from 'pages/api/threads/[id]/resolve';

export class CommentsApi {
  addComment(request: Omit<CommentCreate, 'userId'>): Promise<Comment> {
    return http.POST('/api/comments', request);
  }

  editComment(commentId: string, content: PageContent): Promise<Comment> {
    return http.PUT(`/api/comments/${commentId}`, { content });
  }

  deleteComment(commentId: string) {
    return http.DELETE(`/api/comments/${commentId}`);
  }

  getThreads(pageId: string): Promise<ThreadWithComments[]> {
    return http.GET(`/api/pages/${pageId}/threads`);
  }

  deleteThread(threadId: string) {
    return http.DELETE(`/api/threads/${threadId}`);
  }

  resolveThread(threadId: string, request: ResolveThreadRequest) {
    return http.PUT(`/api/threads/${threadId}/resolve`, request);
  }

  resolveMultipleThreads(payload: MultipleThreadsInput) {
    return http.POST('/api/threads/resolve', payload);
  }
}
