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
  const { pageId } = router.query;
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
    if (publicShare === true) {
      return;
    }
    setPages((_pages) => _pages.map(p => p.id === currentPage!.id ? { ...p, ...updates } : p));
    setCurrentPage(_page => ({ ..._page, ...updates }) as Page);
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
    else if (pageId && pages.length) {
      const pageByPath = pages.find(page => page.path === pageId || page.id === pageId);
      if (pageByPath) {
        setTitleState(pageByPath.title);
        setCurrentPage(pageByPath);
      }
      else {
        setPageNotFound(true);
      }
    }
  }, [pageId, pages.length > 0]);

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
