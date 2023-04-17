import type { Comment } from '@prisma/client';

import * as http from 'adapters/http';
import type { CommentCreate, CommentWithUser } from 'lib/comments/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type {
  MultipleThreadsInput,
  ThreadCreate,
  ThreadWithComments,
  ThreadWithCommentsAndAuthors
} from 'lib/threads/interfaces';
import type { ResolveThreadRequest } from 'pages/api/threads/[id]/resolve';

export class CommentsApi {
  addComment(request: Omit<CommentCreate, 'userId'>): Promise<Comment | CommentWithUser> {
    return http.POST('/api/comments', request);
  }

  editComment(commentId: string, content: PageContent): Promise<Comment | CommentWithUser> {
    return http.PUT(`/api/comments/${commentId}`, { content });
  }

  deleteComment(commentId: string) {
    return http.DELETE(`/api/comments/${commentId}`);
  }

  getThreads(pageId: string): Promise<ThreadWithComments[] | ThreadWithCommentsAndAuthors[]> {
    return http.GET(`/api/pages/${pageId}/threads`);
  }

  startThread(request: Omit<ThreadCreate, 'userId'>): Promise<ThreadWithComments | ThreadWithCommentsAndAuthors> {
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
