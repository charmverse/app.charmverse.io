
import { NodeViewProps } from '@bangle.dev/core';
import styled from '@emotion/styled';
import { Box, IconButton } from '@mui/material';
import { Page } from '@prisma/client';
import CardDialog from 'components/common/BoardEditor/focalboard/src/components/cardDialog';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import { getSortedBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { getViewCardsSortedFilteredAndGrouped } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { getClientConfig } from 'components/common/BoardEditor/focalboard/src/store/clientConfig';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getCurrentViewDisplayBy, getCurrentViewGroupBy, getSortedViews, getView } from 'components/common/BoardEditor/focalboard/src/store/views';
import FocalBoardPortal from 'components/common/BoardEditor/FocalBoardPortal';
import debouncePromise from 'lib/utilities/debouncePromise';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import { createBoardView } from 'lib/focalboard/boardView';
import { addPage } from 'lib/pages';
import { isTruthy } from 'lib/utilities/types';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Add } from '@mui/icons-material';
import charmClient from 'charmClient';
import BoardSelection from './SourceSelection';

// Lazy load focalboard entrypoint (ignoring the redux state stuff for now)
const CenterPanel = dynamic(() => import('components/common/BoardEditor/focalboard/src/components/centerPanel'), {
  ssr: false
});

const StylesContainer = styled.div<{ containerWidth?: number }>`

  .BoardComponent {
    overflow: visible;
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
  linkedSourceId: string;
  source: 'board_page';
  type: 'linked' | 'embedded'
}

export default function DatabaseView ({ containerWidth, readOnly: readOnlyOverride, node, updateAttrs }: DatabaseViewProps) {
  const [databaseView, setDatabaseView] = useState(node.attrs as DatabaseView);
  const { linkedSourceId, type } = databaseView;
  const allViews = useAppSelector(getSortedViews);

  const views = allViews.filter(view => view.parentId === linkedSourceId);
  // Make the first view active view
  // Keep track of which view is currently visible
  const [currentViewId, setCurrentViewId] = useState<string | null>(views[0]?.id || null);
  const [isSelectingSource, setIsSelectingSource] = useState(currentViewId === null);
  const currentView = useAppSelector(getView(currentViewId || ''));

  const groupByProperty = useAppSelector(getCurrentViewGroupBy);
  const dateDisplayProperty = useAppSelector(getCurrentViewDisplayBy);
  const clientConfig = useAppSelector(getClientConfig);
  const [space] = useCurrentSpace();
  const { user } = useUser();
  const { currentPageId, pages, setPages, getPagePermissions } = usePages();

  const [shownCardId, setShownCardId] = useState<string | undefined>('');
  const boardPages = Object.values(pages).filter(p => p?.type === 'board').filter(isTruthy);

  const boards = useAppSelector(getSortedBoards);
  const board = boards.find(b => type === 'linked' ? b.id === currentView?.fields.linkedSourceId : b.id === currentView?.parentId);

  const cards = useAppSelector(getViewCardsSortedFilteredAndGrouped({
    boardId: board?.id || '',
    viewId: currentViewId || ''
  }));

  const accessibleCards = cards.filter(card => pages[card.id]);

  // TODO: Handle for other sources in future like workspace users
  const currentPagePermissions = getPagePermissions(linkedSourceId || '');

  function showCard (cardId?: string) {
    setShownCardId(cardId);
  }

  async function selectDatabase ({ boardId }: { boardId: string }) {
    const view = createBoardView();
    view.fields.viewType = 'board';
    view.parentId = linkedSourceId;
    view.rootId = linkedSourceId;
    view.title = 'Board view';
    // A new property to indicate that this view was creating for inline databases only
    view.fields.sourceType = 'board_page';
    view.fields.linkedSourceId = boardId;
    await mutator.insertBlock(view);
    setIsSelectingSource(false);
    setCurrentViewId(view.id);
  }

  const debouncedPageUpdate = debouncePromise(async (updates: Partial<Page>) => {
    const pageId = board?.id;
    if (!pageId) {
      return;
    }
    const updatedPage = await charmClient.updatePage({ id: pageId, ...updates });
    setPages((_pages) => ({
      ..._pages,
      [pageId]: updatedPage
    }));
    return updatedPage;
  }, 500);

  useEffect(() => {
    updateAttrs(databaseView);
  }, [databaseView]);

  async function createDatabase () {
    if (!space || !user) return;

    const { page, view } = await addPage({
      type: 'inline_board',
      parentId: currentPageId,
      spaceId: space.id,
      createdBy: user.id
    });

    setDatabaseView({
      source: 'board_page',
      linkedSourceId: page.id,
      type: 'embedded'
    });

    if (view) {
      setCurrentViewId(view.id);
    }
  }

  const readOnly = typeof readOnlyOverride === 'undefined' ? currentPagePermissions.edit_content !== true : readOnlyOverride;

  if (!readOnly) {
    if (isSelectingSource) {
      return (
        <BoardSelection
          showGoBackButton={views.length !== 0}
          onClickBack={() => setIsSelectingSource(false)}
          pages={boardPages}
          onCreate={createDatabase}
          onSelect={selectDatabase}
        />
      );
    }
  }

  if (!board || !currentView) {
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
        <Box sx={{
          '.top-head': {
            padding: 0
          },
          '.MuiTypography-root': {
            textDecoration: 'none'
          },
          '.MuiTypography-root:hover': {
            textDecoration: 'none'
          }
        }}
        >
          <CenterPanel
            disableUpdatingUrl
            addViewMenu={type === 'linked' ? (
              <IconButton
                onClick={() => {
                  setIsSelectingSource(true);
                }}
                color='secondary'
                size='small'
              >
                <Add fontSize='small' />
              </IconButton>
            ) : undefined}
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
            pageType={type === 'linked' ? 'inline_linked_board' : 'inline_board'}
            pagePath={pages[board.id]?.path}
            setPage={debouncedPageUpdate}
            cards={accessibleCards}
            showCard={showCard}
            showInlineTitle={true}
            activeView={currentView}
            groupByProperty={property}
            dateDisplayProperty={displayProperty}
            views={views}
            maxTabsShown={2}
          />
        </Box>
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
