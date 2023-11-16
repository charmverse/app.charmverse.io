import type { ThreadCreatePayload, ThreadWithComments, ThreadWithCommentsAndAuthors } from 'lib/threads/interfaces';

import { usePOST } from './helpers';

export function useCreateThread() {
  return usePOST<Omit<ThreadCreatePayload, 'userId'>, Promise<ThreadWithComments | ThreadWithCommentsAndAuthors>>(
    '/api/threads'
  );
}
