import type { ThreadCreatePayload, ThreadWithComments } from '@packages/lib/threads/interfaces';

import { usePOST } from './helpers';

export function useCreateThread() {
  return usePOST<Omit<ThreadCreatePayload, 'userId'>, Promise<ThreadWithComments>>('/api/threads');
}
