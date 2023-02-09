import { usePageIdFromPath } from 'hooks/usePageFromPath';
import { usePages } from 'hooks/usePages';

import Favicon from './Favicon';

export default function CurrentPageFavicon() {
  const currentPageId = usePageIdFromPath();
  const { pages } = usePages();
  const currentPage = currentPageId ? pages[currentPageId] : undefined;
  return <Favicon pageIcon={currentPage?.icon} />;
}
