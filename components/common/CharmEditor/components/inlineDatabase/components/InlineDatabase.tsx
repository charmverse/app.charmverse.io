import styled from '@emotion/styled';
import type { Page } from '@prisma/client';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import type { KeyboardEvent, MouseEvent, ClipboardEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

import CardDialog from 'components/common/BoardEditor/focalboard/src/components/cardDialog';
import { getSortedBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getSortedViews, getView } from 'components/common/BoardEditor/focalboard/src/store/views';
import FocalBoardPortal from 'components/common/BoardEditor/FocalBoardPortal';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { usePages } from 'hooks/usePages';
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

    // Hide calculations footer
    .CalculationRow {
      display: none;
    }
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
  const allViews = useAppSelector(getSortedViews);
  const router = useRouter();

  const views = useMemo(() => allViews.filter((view) => view.parentId === pageId), [pageId, allViews]);
  const [currentViewId, setCurrentViewId] = useState<string | null>(views[0]?.id || null);
  const currentView = useAppSelector(getView(currentViewId || '')) ?? undefined;
  const { pages, updatePage } = usePages();

  const [shownCardId, setShownCardId] = useState<string | null>(null);

  const boards = useAppSelector(getSortedBoards);
  const board = boards.find((b) => b.id === pageId);
  const boardPage = pages[pageId];

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

  const readOnlySourceData = currentView?.fields?.sourceType === 'google_form'; // blocks that are synced cannot be edited
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
          disableUpdatingUrl
          showView={setCurrentViewId}
          onDeleteView={deleteView}
          hideBanner
          readOnly={readOnly}
          readOnlySourceData={readOnlySourceData}
          board={board}
          embeddedBoardPath={pages[pageId]?.path}
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
