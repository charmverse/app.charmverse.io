import { ReactElement, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PageLayout } from 'components/common/page-layout';
import { useTitleState } from 'components/common/page-layout/PageTitle';
import { Editor } from 'components/editor';
import { usePages } from 'hooks/usePages';
import { Page } from 'models';

export default function BlocksEditorPage () {
  const { pages, setPages, setCurrentPage } = usePages();
  const router = useRouter();
  const { pagePath } = router.query;
  const pageByPath = pages.find(page => page.path === pagePath) || pages[0];
  const [, setTitleState] = useTitleState();

  function setPage (page: Page) {
    setPages(pages.map(p => p.id === page.id ? page : p));
  }

  useEffect(() => {
    setTitleState(pageByPath.title);
    setCurrentPage(pageByPath);
  }, [pageByPath]);

  return (
    <Editor page={pageByPath} setPage={setPage} />
  );
}

BlocksEditorPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
