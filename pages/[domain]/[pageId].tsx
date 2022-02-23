import { Prisma } from '@prisma/client';
import charmClient from 'charmClient';
import { PageLayout } from 'components/common/page-layout';
import { DatabaseEditor } from 'components/databases';
import { Editor } from 'components/editor';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import { Page } from 'models';
import { useRouter } from 'next/router';
import { ReactElement, useEffect } from 'react';

export default function BlocksEditorPage () {

  const { currentPage, pages, setPages, setCurrentPage } = usePages();
  const router = useRouter();
  const { pageId } = router.query;
  const [, setTitleState] = usePageTitle();

  async function setPage (updates: Partial<Page>) {
    setPages(pages.map(p => p.id === currentPage!.id ? { ...p, ...updates } : p));
    setCurrentPage(_page => ({ ..._page, ...updates }) as Page);
    if (updates.title) {
      setTitleState(updates.title);
    }
    await charmClient.updatePage({ id: currentPage!.id, ...updates } as Prisma.PageUpdateInput);
  }

  useEffect(() => {
    if (pageId && pages.length) {
      const pageByPath = pages.find(page => page.path === pageId || page.id === pageId);
      if (pageByPath) {
        setTitleState(pageByPath.title);
        setCurrentPage(pageByPath);
      }
    }
  }, [pageId, pages.length > 0]);

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
