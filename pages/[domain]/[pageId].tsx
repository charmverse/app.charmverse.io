
import { Page } from '@prisma/client';
import PageLayout from 'components/common/PageLayout';
import EditorPage from 'components/[pageId]/EditorPage/EditorPage';
import { usePages } from 'hooks/usePages';
import { useRouter } from 'next/router';
import { ReactElement } from 'react';

interface Props {
  shouldLoadPublicPage: boolean
}

export default function BlocksEditorPage ({ shouldLoadPublicPage = false }: Props) {
  const { setCurrentPageId, pages } = usePages();
  const router = useRouter();

  if (shouldLoadPublicPage) {
    const pageId = router.query.pageId as string;
    return <EditorPage shouldLoadPublicPage={true} onPageLoad={(_pageId) => setCurrentPageId(_pageId)} pageId={pageId} />;
  }

  // Handle non public page
  const pagePath = router.query.pageId as string;
  const pageIdList = Object.values(pages ?? {}) as Page[];
  const pageId = pageIdList.find(p => p.path === pagePath)?.id;
  return <EditorPage shouldLoadPublicPage={false} onPageLoad={(_pageId) => setCurrentPageId(_pageId)} pageId={pageId ?? pagePath} />;
}

BlocksEditorPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
