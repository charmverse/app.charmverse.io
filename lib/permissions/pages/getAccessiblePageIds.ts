import type { PagesRequest } from '@charmverse/core/pages';

import { getAccessiblePages } from './getAccessiblePages';

export async function getAccessiblePageIds(input: PagesRequest): Promise<string[]> {
  return getAccessiblePages(input).then((pages) => pages.map((p) => p.id));
}
