import { baseUrl } from 'config/constants';

export function getPagePermalink({ pageId }: { pageId: string }) {
  return `${baseUrl ?? 'https://app.charmverse.io'}/permalink/${pageId}`;
}
