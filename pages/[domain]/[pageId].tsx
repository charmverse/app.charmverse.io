import EditorPage from 'components/[pageId]/EditorPage/EditorPage';
import { SharedPage } from 'components/[pageId]/SharedPage/SharedPage';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { usePageFromPath } from 'hooks/usePageFromPath';
import { useSharedPage } from 'hooks/useSharedPage';

export default function PageView() {
  const { publicPage, hasSharedPageAccess } = useSharedPage();
  const currentPage = usePageFromPath();

  if (hasSharedPageAccess && publicPage) {
    return <SharedPage publicPage={publicPage} />;
  } else if (!currentPage) {
    return null;
  }

  return <EditorPage pageId={currentPage.id} />;
}

PageView.getLayout = getPageLayout;
