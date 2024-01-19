import type { ModifyChildPagesResponse } from 'lib/pages';

import { usePUT } from './helpers';

export function useTrashPages() {
  return usePUT<{ pageIds: string[]; trash: boolean }, ModifyChildPagesResponse>('/api/pages/trash');
}
