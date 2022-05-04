
import PageLayout from 'components/common/PageLayout';
import EditorPage from 'components/[pageId]/EditorPage/EditorPage';
import { usePages } from 'hooks/usePages';
import { useRouter } from 'next/router';
import { ReactElement } from 'react';

/**
 * @viewId - Enforce a specific view inside the nested blocks editor
 */
interface IBlocksEditorPage {
  publicShare?: boolean
}

export default function BlocksEditorPage ({ publicShare = false }: IBlocksEditorPage) {
  const { currentPageId, setCurrentPageId } = usePages();
  const router = useRouter();
  const pageId = router.query.pageId as string;
  return <EditorPage currentPageId={currentPageId} onPageLoad={(_pageId) => setCurrentPageId(_pageId)} pageId={pageId} publicShare={publicShare} />;
}

BlocksEditorPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
