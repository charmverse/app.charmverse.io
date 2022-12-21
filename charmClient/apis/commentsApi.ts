import * as http from 'adapters/http';
import type { CommentCreate, CommentWithUser } from 'lib/comments/interfaces';
import type { MultipleThreadsInput, ThreadCreate, ThreadWithCommentsAndAuthors } from 'lib/threads/interfaces';
import type { PageContent } from 'models';
import type { ResolveThreadRequest } from 'pages/api/threads/[id]/resolve';

export class CommentsApi {
  addComment(request: Omit<CommentCreate, 'userId'>): Promise<CommentWithUser> {
    return http.POST('/api/comments', request);
  }

  editComment(commentId: string, content: PageContent): Promise<CommentWithUser> {
    return http.PUT(`/api/comments/${commentId}`, { content });
  }

  deleteComment(commentId: string) {
    return http.DELETE(`/api/comments/${commentId}`);
  }

  getThreads(pageId: string): Promise<ThreadWithCommentsAndAuthors[]> {
    return http.GET(`/api/pages/${pageId}/threads`);
  }

  startThread(request: Omit<ThreadCreate, 'userId'>): Promise<ThreadWithCommentsAndAuthors> {
    return http.POST('/api/threads', request);
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
