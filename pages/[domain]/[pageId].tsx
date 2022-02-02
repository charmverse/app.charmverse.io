import { ReactElement, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PageLayout } from 'components/common/page-layout';
import { useTitleState } from 'components/common/page-layout/PageTitle';
import { Editor } from 'components/editor';
import { DatabaseEditor } from 'components/databases';
import { usePages } from 'hooks/usePages';
import { Page } from 'models';

export default function BlocksEditorPage () {
  const { pages, setPages, setCurrentPage } = usePages();
  const router = useRouter();
  const { pageId } = router.query;
  const pageByPath = pages.find(page => page.path === pageId || page.id === pageId) || pages[0];
  const [, setTitleState] = useTitleState();

  function setPage (page: Page) {
    setPages(pages.map(p => p.id === page.id ? page : p));
  }

  useEffect(() => {
    setTitleState(pageByPath.title);
    setCurrentPage(pageByPath);
  }, [pageByPath]);

  return (
    (pageByPath?.type === 'database')
      ? <DatabaseEditor page={pageByPath} setPage={setPage} />
      : <Editor page={pageByPath} setPage={setPage} />
  );
}

BlocksEditorPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
