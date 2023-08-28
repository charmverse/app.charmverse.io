import type { ThreadCreate, ThreadWithComments, ThreadWithCommentsAndAuthors } from 'lib/threads/interfaces';

import { usePOST } from './helpers';

export function useCreateThread() {
  return usePOST<Omit<ThreadCreate, 'userId'>, Promise<ThreadWithComments | ThreadWithCommentsAndAuthors>>(
    '/api/threads'
  );
}
