import type { ModifyChildPagesResponse } from 'lib/pages';
import type { PageWithContent } from 'lib/pages/interfaces';

import { useGET, usePUT } from './helpers';

export function useTrashPages() {
  return usePUT<{ pageIds: string[]; trash: boolean }, ModifyChildPagesResponse>('/api/pages/trash');
}

export function useGetPage(pageId?: string) {
  return useGET<PageWithContent>(pageId ? `/api/pages/${pageId}` : null);
}
