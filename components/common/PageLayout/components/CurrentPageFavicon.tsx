import { useFocusedPage } from 'hooks/useFocusedPage';
import { usePages } from 'hooks/usePages';

import Favicon from './Favicon';

export default function CurrentPageFavicon() {
  const { currentPageId } = useFocusedPage();
  const { pages } = usePages();
  const currentPage = pages[currentPageId];
  return <Favicon pageIcon={currentPage?.icon} />;
}
