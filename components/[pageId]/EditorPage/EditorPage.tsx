import type { Page } from '@charmverse/core/prisma';
import log from 'loglevel';
import { useCallback, useEffect } from 'react';

import { trackPageView } from 'charmClient/hooks/track';
import ErrorPage from 'components/common/errors/ErrorPage';
import { useCharmEditor } from 'hooks/useCharmEditor';
import { useCurrentPage } from 'hooks/useCurrentPage';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePage } from 'hooks/usePage';
import { usePageTitle } from 'hooks/usePageTitle';
import debouncePromise from 'lib/utilities/debouncePromise';

import { DatabasePage } from '../DatabasePage';
import DocumentPage from '../DocumentPage';

export function EditorPage({ pageId: pageIdOrPath }: { pageId: string }) {
  const { setCurrentPageId } = useCurrentPage();
  const { editMode, resetPageProps, setPageProps } = useCharmEditor();
  const [, setTitleState] = usePageTitle();
  const { space: currentSpace } = useCurrentSpace();

  const {
    error: pageWithContentError,
    page,
    refreshPage,
    updatePage
  } = usePage({ pageIdOrPath, spaceId: currentSpace?.id });

  const readOnly =
    (page?.permissionFlags.edit_content === false && editMode !== 'suggesting') || editMode === 'viewing';

  useEffect(() => {
    if (page) {
      trackPageView({
        type: page.type,
        pageId: page.id,
        spaceId: page.spaceId
      });
      setCurrentPageId(page.id);
    }
    return () => {
      resetPageProps();
    };
  }, [page?.id]);

  // reset page id on unmount
  useEffect(() => {
    return () => {
      setCurrentPageId('');
    };
  }, []);

  // set page attributes of the primary charm editor
  useEffect(() => {
    if (!page) {
      // wait for pages loaded for permissions to be correct
      return;
    }
    if (!editMode) {
      if (page.permissionFlags.edit_content) {
        setPageProps({ permissions: page.permissionFlags, editMode: 'editing' });
      } else {
        setPageProps({ permissions: page.permissionFlags, editMode: 'viewing' });
      }
    } else {
      // pass editMode thru to fix hot-reloading which resets the prop
      setPageProps({ permissions: page.permissionFlags, editMode });
    }
  }, [page?.permissionFlags.edit_content]);

  const savePage = useCallback(
    debouncePromise(async (updates: Partial<Page>) => {
      if (!page) {
        return;
      }
      if (updates.hasOwnProperty('title')) {
        setTitleState(updates.title || 'Untitled');
      }
      setPageProps({ isSaving: true });
      updatePage({ id: page.id, ...updates })
        .catch((err: any) => {
          log.error('Error saving page', err);
        })
        .finally(() => {
          setPageProps({ isSaving: false });
        });
    }, 500),
    [page?.id]
  );

  useEffect(() => {
    // make sure current page is loaded
    if (page?.title) {
      setTitleState(page.title || 'Untitled');
    }
  }, [page?.title]);

  if (pageWithContentError === 'access_denied') {
    return <ErrorPage message={"Sorry, you don't have access to this page"} />;
  } else if (pageWithContentError === 'page_not_found') {
    return <ErrorPage message={"Sorry, that page doesn't exist"} />;
  }
  // Wait for permission load
  else if (!page) {
    return null;
  }
  // Interpret page permission
  else if (page.permissionFlags.read === false) {
    return <ErrorPage message={"Sorry, you don't have access to this page"} />;
  } else if (page.permissionFlags.read === true) {
    if (
      page.type === 'board' ||
      page.type === 'inline_board' ||
      page.type === 'inline_linked_board' ||
      page.type === 'linked_board'
    ) {
      return <DatabasePage page={page} setPage={savePage} pagePermissions={page.permissionFlags} />;
    } else {
      return (
        // Document page is used in a few places, so it is responsible for retrieving its own permissions
        <DocumentPage page={page} refreshPage={refreshPage} readOnly={readOnly} savePage={savePage} />
      );
    }
  }
  return null;
}
