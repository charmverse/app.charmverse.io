import { useRouter } from 'next/router';

import EditorPage from 'components/[pageId]/EditorPage/EditorPage';
import { SharedPage } from 'components/[pageId]/SharedPage/SharedPage';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { usePages } from 'hooks/usePages';
import { useSharedPage } from 'hooks/useSharedPage';
import type { PageMeta } from 'lib/pages';

export default function BlocksEditorPage() {
  const { pages } = usePages();
  const router = useRouter();
  const { publicPage, hasSharedPageAccess } = useSharedPage();

  const pagePath = router.query.pageId as string;
  const pageIdList = Object.values(pages ?? {}) as PageMeta[];
  const pageId = pageIdList.find((p) => p.path === pagePath)?.id;

  if (hasSharedPageAccess && publicPage) {
    return <SharedPage publicPage={publicPage} />;
  }

  return <EditorPage pageId={pageId ?? pagePath} />;
}

BlocksEditorPage.getLayout = getPageLayout;
