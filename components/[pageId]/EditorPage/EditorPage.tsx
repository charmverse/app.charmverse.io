import { log } from '@charmverse/core/log';
import type { Page } from '@charmverse/core/prisma';
import { Box } from '@mui/material';
import { useCallback, useEffect } from 'react';

import charmClient from 'charmClient';
import { trackPageView } from 'charmClient/hooks/track';
import ErrorPage from 'components/common/errors/ErrorPage';
import { useCharmEditor } from 'hooks/useCharmEditor';
import { useCurrentPage } from 'hooks/useCurrentPage';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePage } from 'hooks/usePage';
import { usePageTitle } from 'hooks/usePageTitle';
import debouncePromise from 'lib/utils/debouncePromise';

import { DatabasePage } from '../DatabasePage';
import { DocumentPageWithSidebars } from '../DocumentPage/DocumentPageWithSidebars';

export function EditorPage({ pageId: pageIdOrPath }: { pageId: string }) {
  const { setCurrentPageId } = useCurrentPage();
  const { editMode, resetPageProps, setPageProps } = useCharmEditor();
  const [, setTitleState] = usePageTitle();
  const { space: currentSpace } = useCurrentSpace();
  const {
    error: pageWithContentError,
    page,
    updatePage,
    refreshPage
  } = usePage({ pageIdOrPath, spaceId: currentSpace?.id });

  const readOnly =
    (page?.permissionFlags.edit_content === false && editMode !== 'suggesting') || editMode === 'viewing';

  useEffect(() => {
    if (page && currentSpace) {
      trackPageView({
        type: page.type,
        pageId: page.id,
        spaceId: page.spaceId,
        spaceDomain: currentSpace.domain,
        spaceCustomDomain: currentSpace.customDomain
      });
      if (currentSpace?.domain === 'op-grants') {
        if (page.type === 'proposal') {
          charmClient.track.trackActionOp('successful_application_form_open', {});
        }
        charmClient.track.trackActionOp('page_view', {
          type: page.type,
          path: page.path,
          url: window.location.href
        });
      }
      setCurrentPageId(page.id);
    }
    return () => {
      resetPageProps();
    };
  }, [page?.id, !!currentSpace]);

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
    if (page) {
      setTitleState(page.title || 'Untitled');
    }
  }, [page?.title]);

  if (pageWithContentError === 'access_denied') {
    return <ErrorPage message="Sorry, you don't have access to this page" />;
  } else if (pageWithContentError === 'page_not_found') {
    return <ErrorPage message="Sorry, that page doesn't exist" />;
  } else if (pageWithContentError === 'system_error') {
    return <ErrorPage message='Sorry, there was an error loading this page' />;
  }
  // Wait for permission load
  else if (!page) {
    return null;
  }
  // Interpret page permission
  else if (page.permissionFlags.read === false) {
    return <ErrorPage message="Sorry, you don't have access to this page" />;
  } else if (page.permissionFlags.read === true) {
    if (
      page.type === 'board' ||
      page.type === 'inline_board' ||
      page.type === 'inline_linked_board' ||
      page.type === 'linked_board'
    ) {
      return <DatabasePage page={page} setPage={savePage} pagePermissions={page.permissionFlags} />;
    } else {
      // Document page is used in a few places, so it is responsible for retrieving its own permissions
      return (
        <Box display='flex' flexGrow={1} minHeight={0} /** add minHeight so that flexGrow expands to correct heigh */>
          <DocumentPageWithSidebars refreshPage={refreshPage} page={page} readOnly={readOnly} savePage={savePage} />
        </Box>
      );
    }
  }
  return null;
}
