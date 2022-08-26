
import { NodeViewProps } from '@bangle.dev/core';
import styled from '@emotion/styled';
import { Box } from '@mui/material';
import { Page } from '@prisma/client';
import CardDialog from 'components/common/BoardEditor/focalboard/src/components/cardDialog';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import { getSortedBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { getClientConfig } from 'components/common/BoardEditor/focalboard/src/store/clientConfig';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getCurrentViewDisplayBy, getCurrentViewGroupBy, getSortedViews, getView } from 'components/common/BoardEditor/focalboard/src/store/views';
import FocalBoardPortal from 'components/common/BoardEditor/FocalBoardPortal';
import debouncePromise from 'lib/utilities/debouncePromise';
import { usePages } from 'hooks/usePages';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import charmClient from 'charmClient';

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
    padding-left: 24px;
    ${({ theme }) => theme.breakpoints.up('md')} {
      --side-margin: ${({ containerWidth }) => `calc((${containerWidth}px - 100%) / 2)`};
      margin: 0 calc(-1 * var(--side-margin));
      padding-left: var(--side-margin);
    }
  }

  // remove extra padding on Table view
  .Table {
    margin-top: 0;

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

interface DatabaseViewProps extends NodeViewProps {
  containerWidth?: number; // pass in the container width so we can extend full width
  readOnly?: boolean;
}

interface DatabaseView {
  // Not using linkedPageId as the source could be other things
  // source field would be used to figure out what type of source it actually is
  pageId: string;
  source: 'board_page';
}

export default function DatabaseView ({ containerWidth, readOnly: readOnlyOverride, node }: DatabaseViewProps) {
  const pageId = node.attrs.pageId as string;
  const allViews = useAppSelector(getSortedViews);

  const views = allViews.filter(view => view.parentId === pageId);
  // Make the first view active view
  // Keep track of which view is currently visible
  const [currentViewId, setCurrentViewId] = useState<string | null>(views[0]?.id || null);
  const currentView = useAppSelector(getView(currentViewId || '')) ?? undefined;

  const groupByProperty = useAppSelector(getCurrentViewGroupBy);
  const dateDisplayProperty = useAppSelector(getCurrentViewDisplayBy);
  const clientConfig = useAppSelector(getClientConfig);
  const { pages, setPages, getPagePermissions } = usePages();

  const [shownCardId, setShownCardId] = useState<string | undefined>('');

  const boards = useAppSelector(getSortedBoards);
  const board = boards.find(b => b.id === pageId);

  // TODO: Handle for other sources in future like workspace users
  const currentPagePermissions = getPagePermissions(pageId || '');

  function showCard (cardId?: string) {
    setShownCardId(cardId);
  }

  const debouncedPageUpdate = debouncePromise(async (updates: Partial<Page>) => {
    const updatedPage = await charmClient.updatePage({ id: pageId, ...updates });
    setPages((_pages) => ({
      ..._pages,
      [pageId]: updatedPage
    }));
    return updatedPage;
  }, 500);

  const readOnly = typeof readOnlyOverride === 'undefined' ? currentPagePermissions.edit_content !== true : readOnlyOverride;

  if (!board) {
    return null;
  }

  let property = groupByProperty;
  if ((!property || property.type !== 'select') && currentView?.fields.viewType === 'board') {
    property = board.fields.cardProperties.find((o: any) => o.type === 'select');
  }

  let displayProperty = dateDisplayProperty;
  if (!displayProperty && currentView?.fields.viewType === 'calendar') {
    displayProperty = board.fields.cardProperties.find((o: any) => o.type === 'date');
  }

  return (
    <>
      <StylesContainer className='focalboard-body' containerWidth={containerWidth}>
        <CenterPanel
          disableUpdatingUrl
          onViewTabClick={(viewId) => {
            setCurrentViewId(viewId);
          }}
          onDeleteView={(viewId) => {
            setCurrentViewId(views.filter(view => view.id !== viewId)?.[0]?.id ?? null);
          }}
          hideBanner
          clientConfig={clientConfig}
          readonly={readOnly}
          board={board}
          embeddedBoardPath={pages[pageId]?.path}
          setPage={debouncedPageUpdate}
          showCard={showCard}
          showInlineTitle={true}
          activeView={currentView}
          views={views}
          maxTabsShown={2}
        />
      </StylesContainer>
      {typeof shownCardId === 'string' && shownCardId.length !== 0 && (
        <RootPortal>
          <CardDialog
            key={shownCardId}
            cardId={shownCardId}
            onClose={() => showCard(undefined)}
            showCard={(cardId) => showCard(cardId)}
            readonly={readOnly}
          />
        </RootPortal>
      )}
      <FocalBoardPortal />
    </>
  );
}
