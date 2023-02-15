import EditorPage from 'components/[pageId]/EditorPage/EditorPage';
import { SharedPage } from 'components/[pageId]/SharedPage/SharedPage';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { usePageIdFromPath } from 'hooks/usePageFromPath';
import { useSharedPage } from 'hooks/useSharedPage';

export default function PageView() {
  const { publicPage, hasSharedPageAccess } = useSharedPage();
  const basePageId = usePageIdFromPath();

  if (hasSharedPageAccess && publicPage) {
    return <SharedPage publicPage={publicPage} />;
  }
  if (!basePageId) {
    return null;
  }

  return <EditorPage pageId={basePageId} />;
}

PageView.getLayout = getPageLayout;
