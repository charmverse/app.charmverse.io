
import { usePages } from 'hooks/usePages';
import Favicon from './Favicon';

export default function CurrentPageFavicon () {
  const { currentPageId, pages } = usePages();
  const currentPage = pages[currentPageId];
  console.log('current page', currentPage);
  return <Favicon pageIcon={currentPage?.icon} />;
}
