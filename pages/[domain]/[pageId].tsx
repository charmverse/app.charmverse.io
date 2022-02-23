import { Prisma } from '@prisma/client';
import charmClient from 'charmClient';
import { PageLayout } from 'components/common/page-layout';
import { DatabaseEditor } from 'components/databases';
import { Editor } from 'components/editor';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import { Page } from 'models';
import { useRouter } from 'next/router';
import { ReactElement, useCallback, useEffect } from 'react';

export default function BlocksEditorPage () {

  const { pages, currentPage, setPages, setCurrentPage } = usePages();
  const router = useRouter();
  const { pageId } = router.query;
  const [, setTitleState] = usePageTitle();

  const setPage = useCallback(async (updates: Partial<Page>) => {
    // const page = pages.find(p => p.path === pageId || p.id === pageId) || pages[0];
    const updatedPage = { ...updates } as Page;
    console.log('setPage', currentPage, updates);
    // const updatedPage = await charmClient.updatePage(updates as Prisma.PageUpdateInput);
    // setPages(_pages => _pages.map(p => p.id === updatedPage.id ? { ...p, ...updates } : p));
    setCurrentPage(_page => ({ ..._page, ...updates }) as Page);
  }, [currentPage, pages, setPages, setCurrentPage]);
  console.log('Render [pageId].tsx, currentPage:', currentPage);

  useEffect(() => {
    const pageByPath = pages.find(page => page.path === pageId || page.id === pageId) || pages[0];
    if (pageByPath) {
      setTitleState(pageByPath.title);
      console.log('set current page by path', pageByPath);
      setCurrentPage(pageByPath);
    }
  }, [pageId, setCurrentPage, pages.length > 0]);

  if (!currentPage) {
    return null;
  }
  else if (currentPage.type === 'board') {
    return <DatabaseEditor page={currentPage} setPage={setPage} />;
  }
  else {
    return <Editor page={currentPage} setPage={setPage} />;
  }
}

BlocksEditorPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
