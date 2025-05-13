import type { Page } from '@charmverse/core/prisma';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import type { ClipboardEvent, KeyboardEvent, MouseEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import FocalBoardPortal from 'components/common/DatabaseEditor/DatabasePortal';
import { getBoards } from 'components/common/DatabaseEditor/store/boards';
import { initialDatabaseLoad } from 'components/common/DatabaseEditor/store/databaseBlocksLoad';
import { useAppDispatch, useAppSelector } from 'components/common/DatabaseEditor/store/hooks';
import { makeSelectSortedViews, makeSelectView } from 'components/common/DatabaseEditor/store/views';
import { PageDialog } from 'components/common/PageDialog/PageDialog';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { DbViewSettingsProvider } from 'hooks/useLocalDbViewSettings';
import { usePage } from 'hooks/usePage';
import { usePagePermissions } from 'hooks/usePagePermissions';
import debouncePromise from '@packages/lib/utils/debouncePromise';

import type { CharmNodeViewProps } from '../../nodeView/nodeView';

import { InlineDatabaseContainer } from './InlineDatabaseContainer';

// Lazy load focalboard entrypoint (ignoring the redux state stuff for now)
const CenterPanel = dynamic(() => import('components/common/DatabaseEditor/components/centerPanel'), {
  ssr: false
});

interface DatabaseViewProps extends CharmNodeViewProps {
  containerWidth?: number; // pass in the container width so we can extend full width
}

export function InlineDatabase({ containerWidth, readOnly: readOnlyOverride, node }: DatabaseViewProps) {
  const pageId = node.attrs.pageId as string;
  const selectSortedViews = useMemo(makeSelectSortedViews, []);
  const views = useAppSelector((state) => selectSortedViews(state, pageId));
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { navigateToSpacePath } = useCharmRouter();
  const [currentViewId, setCurrentViewId] = useState<string | null>(views[0]?.id || null);
  useEffect(() => {
    if (!currentViewId && views.length > 0) {
      setCurrentViewId(views[0].id);
    }
  }, [views?.length]);

  const selectView = useMemo(makeSelectView, []);
  const currentView = useAppSelector((state) => selectView(state, currentViewId || '')) ?? undefined;
  const { page: boardPage, updatePage } = usePage({ pageIdOrPath: pageId });
  const [shownCardId, setShownCardId] = useState<string | null>(null);

  const boards = useAppSelector(getBoards);
  const board = boards?.[pageId];

  useEffect(() => {
    // Load the database if it's not already loaded, otherwise the Inline Database might show options for a new db
    if (pageId) {
      dispatch(initialDatabaseLoad({ pageId }));
    }
  }, [pageId]);

  const { permissions: currentPagePermissions } = usePagePermissions({ pageIdOrPath: pageId });

  const debouncedPageUpdate = useMemo(() => {
    return debouncePromise(async (updates: Partial<Page>) => {
      await updatePage({ id: pageId, ...updates });
    }, 500);
  }, [updatePage]);

  const showCard = useCallback(
    async (
      cardId: string | null,
      isTemplate?: boolean,
      event?: React.MouseEvent<HTMLButtonElement, globalThis.MouseEvent>
    ) => {
      if (cardId === null) {
        setShownCardId(null);
        return;
      }

      if (currentView.fields.openPageIn === 'center_peek' || isTemplate) {
        event?.preventDefault();
        setShownCardId(cardId);
      } else if (currentView.fields.openPageIn === 'full_page') {
        navigateToSpacePath(`/${cardId}`);
      }
    },
    [currentView?.fields.openPageIn, navigateToSpacePath, setShownCardId]
  );

  function stopPropagation(e: KeyboardEvent | MouseEvent | ClipboardEvent) {
    e.stopPropagation();
  }

  const readOnly =
    typeof readOnlyOverride === 'undefined' ? currentPagePermissions?.edit_content !== true : readOnlyOverride;

  const deleteView = useCallback(
    (viewId: string) => {
      setCurrentViewId(views.filter((view) => view.id !== viewId)?.[0]?.id ?? null);
    },
    [setCurrentViewId, views]
  );

  if (!board || !boardPage || boardPage.deletedAt !== null) {
    return null;
  }

  return (
    <>
      <DbViewSettingsProvider>
        <InlineDatabaseContainer
          className='focalboard-body'
          containerWidth={containerWidth}
          onKeyPress={stopPropagation}
          onKeyDown={stopPropagation}
          onPaste={stopPropagation}
        >
          <CenterPanel
            currentRootPageId={pageId}
            disableUpdatingUrl
            showView={setCurrentViewId}
            onDeleteView={deleteView}
            hideBanner
            readOnly={readOnly}
            board={board}
            embeddedBoardPath={boardPage.path}
            setPage={debouncedPageUpdate}
            showCard={showCard}
            activeView={currentView}
            views={views}
            page={boardPage}
            // Show more tabs on shared inline database as the space gets increased
            maxTabsShown={router.pathname.startsWith('/share') ? 5 : 3}
          />
        </InlineDatabaseContainer>
        {typeof shownCardId === 'string' && shownCardId.length !== 0 && (
          <PageDialog
            showCard={showCard}
            key={shownCardId}
            pageId={shownCardId}
            onClose={() => setShownCardId(null)}
            readOnly={readOnly}
          />
        )}
      </DbViewSettingsProvider>
      <FocalBoardPortal />
    </>
  );
}
