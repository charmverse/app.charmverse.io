import { PageLayout } from 'components/common/page-layout';
import { usePageTitle } from 'hooks/usePageTitle';
import { DatabaseEditor } from 'components/databases';
import { Editor } from 'components/editor';
import { usePages } from 'hooks/usePages';
import { Page } from 'models';
import { Prisma } from '@prisma/client';
import { useRouter } from 'next/router';
import { ReactElement, useEffect } from 'react';
import charmClient from 'charmClient';

export default function BlocksEditorPage () {
  const { pages, setPages, setCurrentPage } = usePages();
  const router = useRouter();
  const { pageId } = router.query;
  const pageByPath = pages.find(page => page.path === pageId || page.id === pageId) || pages[0];
  const [, setTitleState] = usePageTitle();

  async function setPage (page: Partial<Page>) {
    const updates = { ...pageByPath, ...page } as Prisma.PageUpdateInput;
    const updatedPage = await charmClient.updatePage(updates);
    setPages(pages.map(p => p.id === updatedPage.id ? updatedPage : p));
  }

  useEffect(() => {
    if (pageByPath) {
      setTitleState(pageByPath.title);
      setCurrentPage(pageByPath);
    }
  }, [pageByPath]);

  if (!pageByPath) {
    return null;
  }
  else if (pageByPath.type === 'board') {
    return <DatabaseEditor page={pageByPath} setPage={setPage} />;
  }
  else {
    return <Editor page={pageByPath} setPage={setPage} />;
  }
}

BlocksEditorPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
