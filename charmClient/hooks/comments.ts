import type { ThreadCreatePayload, ThreadWithComments } from 'lib/threads/interfaces';

import { usePOST } from './helpers';

export function useCreateThread() {
  return usePOST<Omit<ThreadCreatePayload, 'userId'>, Promise<ThreadWithComments>>('/api/threads');
}
