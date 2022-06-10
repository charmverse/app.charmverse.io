
import { Page } from '@prisma/client';
import PageLayout from 'components/common/PageLayout';
import EditorPage from 'components/[pageId]/EditorPage/EditorPage';
import { usePages } from 'hooks/usePages';
import { useRouter } from 'next/router';
import { ReactElement } from 'react';

export default function BlocksEditorPage () {

  const { pages } = usePages();
  const router = useRouter();

  const pagePath = router.query.pageId as string;
  const pageIdList = Object.values(pages ?? {}) as Page[];
  const pageId = pageIdList.find(p => p.path === pagePath)?.id;

  if (!pageId) {
    return null;
  }

  return <EditorPage pageId={pageId ?? pagePath} />;

}

BlocksEditorPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
