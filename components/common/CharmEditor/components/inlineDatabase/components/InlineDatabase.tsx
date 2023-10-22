import type { Page } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import type { ClipboardEvent, KeyboardEvent, MouseEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import CardDialog from 'components/common/BoardEditor/focalboard/src/components/cardDialog';
import { getBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { initialDatabaseLoad } from 'components/common/BoardEditor/focalboard/src/store/databaseBlocksLoad';
import { useAppDispatch, useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getSortedViews, getView } from 'components/common/BoardEditor/focalboard/src/store/views';
import FocalBoardPortal from 'components/common/BoardEditor/FocalBoardPortal';
import { usePage } from 'hooks/usePage';
import { usePagePermissions } from 'hooks/usePagePermissions';
import debouncePromise from 'lib/utilities/debouncePromise';

import type { CharmNodeViewProps } from '../../nodeView/nodeView';

// Lazy load focalboard entrypoint (ignoring the redux state stuff for now)
const CenterPanel = dynamic(() => import('components/common/BoardEditor/focalboard/src/components/centerPanel'), {
  ssr: false
});

const StylesContainer = styled.div<{ containerWidth?: number }>`
  .BoardComponent {
    overflow: visible;
  }

  .top-head {
    padding: 0;
  }

  .container-container {
    min-width: unset;
    overflow-x: auto;
    padding: 0;
    // offset padding around document
    margin: 0 -24px;
    padding: 0 24px;
    ${({ theme }) => theme.breakpoints.up('md')} {
      --side-margin: ${({ containerWidth }) => `calc((${containerWidth}px - 100%) / 2)`};
      margin: 0 calc(-1 * var(--side-margin));
      padding: 0 var(--side-margin);
    }
    &.sidebar-visible {
      padding-right: 0;
    }
  }

  // remove extra padding on Table view
  .Table {
    margin-top: 0;
    width: fit-content;
    min-width: 100%;
  }

  // remove extra padding on Kanban view
  .octo-board-header {
    padding-top: 0;
  }

  // remove extra margin on calendar view
  .fc .fc-toolbar.fc-header-toolbar {
    margin-top: 0;
  }

  // adjust columns on Gallery view
  @media screen and (min-width: 600px) {
    .Gallery {
      padding-right: 48px; // offset the left padding from .container-container
      ${({ theme }) => theme.breakpoints.up('md')} {
        padding-right: 80px;
      }
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .GalleryCard {
      width: auto;
    }
  }
`;

interface DatabaseViewProps extends CharmNodeViewProps {
  containerWidth?: number; // pass in the container width so we can extend full width
}

export function InlineDatabase({ containerWidth, readOnly: readOnlyOverride, node }: DatabaseViewProps) {
  const pageId = node.attrs.pageId as string;
  const views = useAppSelector(getSortedViews(pageId));
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [currentViewId, setCurrentViewId] = useState<string | null>(views[0]?.id || null);

  useEffect(() => {
    if (!currentViewId && views.length > 0) {
      setCurrentViewId(views[0].id);
    }
  }, [views?.length]);

  const currentView = useAppSelector(getView(currentViewId || '')) ?? undefined;
  const { page: boardPage, updatePage } = usePage({ pageIdOrPath: pageId });

  const [shownCardId, setShownCardId] = useState<string | null>(null);

  const boards = useAppSelector(getBoards);
  const board = boards?.[pageId];

  useEffect(() => {
    if (!board && pageId) {
      dispatch(initialDatabaseLoad({ pageId }));
    }
  }, [pageId]);

  const { permissions: currentPagePermissions } = usePagePermissions({ pageIdOrPath: pageId });

  const debouncedPageUpdate = useMemo(() => {
    return debouncePromise(async (updates: Partial<Page>) => {
      await updatePage({ id: pageId, ...updates });
    }, 500);
  }, [updatePage]);

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
      <StylesContainer
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
          showCard={setShownCardId}
          activeView={currentView}
          views={views}
          page={boardPage}
          // Show more tabs on shared inline database as the space gets increased
          maxTabsShown={router.pathname.startsWith('/share') ? 5 : 3}
        />
      </StylesContainer>
      {typeof shownCardId === 'string' && shownCardId.length !== 0 && (
        <CardDialog key={shownCardId} cardId={shownCardId} onClose={() => setShownCardId(null)} readOnly={readOnly} />
      )}
      <FocalBoardPortal />
    </>
  );
}
