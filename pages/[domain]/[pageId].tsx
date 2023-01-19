import { useRouter } from 'next/router';

import EditorPage from 'components/[pageId]/EditorPage/EditorPage';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { usePublicPage } from 'components/publicPages/hooks/usePublicPage';
import { PublicPage } from 'components/publicPages/PublicPage';
import { usePages } from 'hooks/usePages';
import type { PageMeta } from 'lib/pages';

export default function BlocksEditorPage() {
  const { pages } = usePages();
  const router = useRouter();
  const { publicPage, hasPublicPageAccess } = usePublicPage();

  const pagePath = router.query.pageId as string;
  const pageIdList = Object.values(pages ?? {}) as PageMeta[];
  const pageId = pageIdList.find((p) => p.path === pagePath)?.id;

  if (hasPublicPageAccess && publicPage) {
    return <PublicPage publicPage={publicPage} />;
  }

  return <EditorPage pageId={pageId ?? pagePath} />;
}

BlocksEditorPage.getLayout = getPageLayout;
