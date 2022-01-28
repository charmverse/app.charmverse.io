import { PageLayout } from 'components/common/page-layout';
import { setTitle } from 'components/common/page-layout/PageTitle';
import { Editor } from 'components/editor';
import { usePages } from 'hooks/usePages';
import { useRouter } from 'next/router';
import { ReactElement } from 'react';

export default function BlocksEditorPage() {
  const [pages] = usePages();
  const router = useRouter();
  const { pagePath } = router.query;
  const pageByPath = pages.find(page => page.path === pagePath) || pages[0];
  setTitle(pageByPath.title);

  return (
    <Editor page={pageByPath} />
  );
}

BlocksEditorPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};