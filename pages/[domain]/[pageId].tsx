import { Prisma } from '@prisma/client';
import charmClient from 'charmClient';
import { PageLayout } from 'components/common/page-layout';
import { DatabaseEditor } from 'components/databases';
import { Editor } from 'components/editor';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import debouncePromise from 'lib/utilities/debouncePromise';
import { Page } from 'models';
import { useRouter } from 'next/router';
import { ReactElement, useEffect, useMemo, useState } from 'react';

/**
 * @viewId - Enforce a specific view inside the nested blocks editor
 */
interface IBlocksEditorPage {
  publicShare?: boolean
}

export default function BlocksEditorPage ({ publicShare = false }: IBlocksEditorPage) {

  const { currentPage, setIsEditing, pages, setPages, setCurrentPage } = usePages();
  const router = useRouter();
  const pageId = router.query.pageId as string;
  const [, setTitleState] = usePageTitle();
  const [pageNotFound, setPageNotFound] = useState(false);
  const [space] = useCurrentSpace();

  const debouncedPageUpdate = useMemo(() => {
    return debouncePromise((input: Prisma.PageUpdateInput) => {
      setIsEditing(true);
      return charmClient.updatePage(input);
    }, 500);
  }, []);

  async function setPage (updates: Partial<Page>) {
    if (!currentPage || publicShare === true) {
      return;
    }
    setPages((_pages) => ({
      ..._pages,
      [currentPage.id]: {
        ..._pages[currentPage.id],
        ...updates
      }
    }));
    if (updates.hasOwnProperty('title')) {
      setTitleState(updates.title || 'Untitled');
    }
    debouncedPageUpdate({ id: currentPage!.id, ...updates } as Prisma.PageUpdateInput)
      .catch((err: any) => {
        console.error('Error saving page', err);
      })
      .finally(() => {
        setIsEditing(false);
      });
  }

  async function loadPublicPage (publicPageId: string) {
    const page = await charmClient.getPublicPage(publicPageId);
    setTitleState(page.title);
    setCurrentPage(page);
  }

  useEffect(() => {
    if (publicShare === true && pageId) {
      loadPublicPage(pageId as string);
    }
    else if (pageId) {
      const pageByPath = pages[pageId] || Object.values(pages).find(page => page.path === pageId);
      if (pageByPath) {
        setTitleState(pageByPath.title);
        setCurrentPage(pageByPath);
      }
      else {
        setPageNotFound(true);
      }
    }
  }, [pageId, Object.keys(pages).length > 0]);

  useEffect(() => {
    // keep currentPage updated with page state
    if (currentPage) {
      setCurrentPage(pages[currentPage.id]);
    }
  }, [pages]);

  if (!currentPage && pageNotFound === true && space) {
    router.push(`/${space.domain}`);
  }

  if (!currentPage) {
    return null;
  }
  else if (currentPage.type === 'board') {
    return <DatabaseEditor page={currentPage} setPage={setPage} readonly={publicShare} />;
  }
  else {
    return <Editor page={currentPage} setPage={setPage} readOnly={publicShare} />;
  }
}

BlocksEditorPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
