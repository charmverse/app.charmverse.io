
import { NodeViewProps } from '@bangle.dev/core';
import styled from '@emotion/styled';
import { Box, Tab, Tabs } from '@mui/material';
import CardDialog from 'components/common/BoardEditor/focalboard/src/components/cardDialog';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import { getSortedBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { getViewCardsSortedFilteredAndGrouped } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { getClientConfig } from 'components/common/BoardEditor/focalboard/src/store/clientConfig';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getCurrentViewDisplayBy, getCurrentViewGroupBy, getSortedViews, getView } from 'components/common/BoardEditor/focalboard/src/store/views';
import FocalBoardPortal from 'components/common/BoardEditor/FocalBoardPortal';
import Button from 'components/common/Button';
import { usePages } from 'hooks/usePages';
import log from 'lib/log';
import { isTruthy } from 'lib/utilities/types';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import PageIcon from 'components/common/PageLayout/components/PageIcon';
import { createBoardView } from 'lib/focalboard/boardView';
import BoardSelection from './BoardSelection';

// Lazy load focalboard entrypoint (ignoring the redux state stuff for now)
const CenterPanel = dynamic(() => import('components/common/BoardEditor/focalboard/src/components/centerPanel'), {
  ssr: false
});

const StylesContainer = styled.div`

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
      margin: 0 -80px;
      padding-left: 80px;
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
  readOnly?: boolean;
}

interface DatabaseViewAttrs {
  pageIds: string[];
  viewIds: string[];
  sources: ('board_page')[];
}

export default function DatabaseView ({ readOnly: readOnlyOverride, node, updateAttrs }: DatabaseViewProps) {
  const [attrs, setAttrs] = useState<DatabaseViewAttrs>(node.attrs as DatabaseViewAttrs);
  // Keep track of which board is currently being viewed
  const [boardIndex, setBoardIndex] = useState<null | number>(attrs.pageIds.length !== 0 ? 0 : null);
  const [isSelectingSource, setIsSelectingSource] = useState(false);

  const boards = useAppSelector(getSortedBoards);
  // Always display the first page and view
  const pageId = boardIndex !== null ? attrs.pageIds[boardIndex] : null;
  const viewId = boardIndex !== null ? attrs.viewIds[boardIndex] : null;

  const board = boards.find(b => b.id === pageId);
  const cards = useAppSelector(getViewCardsSortedFilteredAndGrouped({
    boardId: pageId || '',
    viewId: viewId || ''
  }));
  const allViews = useAppSelector(getSortedViews);
  const boardViews = allViews.filter(view => view.parentId === pageId);
  const activeView = useAppSelector(getView(viewId || ''));
  const groupByProperty = useAppSelector(getCurrentViewGroupBy);
  const dateDisplayProperty = useAppSelector(getCurrentViewDisplayBy);
  const clientConfig = useAppSelector(getClientConfig);
  const { pages, getPagePermissions } = usePages();
  const [shownCardId, setShownCardId] = useState<string | undefined>('');

  const boardPages = Object.values(pages).filter(p => p?.type === 'board').filter(isTruthy);
  const accessibleCards = cards.filter(card => pages[card.id]);

  const currentPagePermissions = getPagePermissions(pageId || '');

  function showCard (cardId?: string) {
    setShownCardId(cardId);
  }

  async function selectBoard (boardId: string) {
    const view = createBoardView();
    view.fields.viewType = 'board';
    view.parentId = boardId;
    view.rootId = boards.find(_board => _board.id === boardId)?.rootId ?? boardId;
    view.title = 'Board view';
    // A new property to indicate that this view was creating for inline databases only
    view.fields.inline = true;

    await mutator.insertBlock(view);
    setAttrs({ sources: [...attrs.sources, 'board_page'], pageIds: [...attrs.pageIds, boardId], viewIds: [...attrs.viewIds, view.id] });
    setIsSelectingSource(false);
    setBoardIndex(boardIndex === null ? 0 : boardIndex + 1);
  }

  useEffect(() => {
    updateAttrs(attrs);
  }, [attrs]);

  if (!board || isSelectingSource) {
    return (
      <BoardSelection
        pages={boardPages}
        onSelect={selectBoard}
        onClickBack={() => {
          setBoardIndex(boardIndex === null ? 0 : boardIndex + 1);
          setIsSelectingSource(false);
        }}
      />
    );
  }

  // If there are no active view then auto view creation process didn't work as expected
  if (!activeView) {
    return null;
  }

  let property = groupByProperty;
  if ((!property || property.type !== 'select') && activeView.fields.viewType === 'board') {
    property = board?.fields.cardProperties.find((o: any) => o.type === 'select');
  }

  let displayProperty = dateDisplayProperty;
  if (!displayProperty && activeView.fields.viewType === 'calendar') {
    displayProperty = board.fields.cardProperties.find((o: any) => o.type === 'date');
  }

  const readOnly = typeof readOnlyOverride === 'undefined' ? currentPagePermissions.edit_content !== true : readOnlyOverride;

  return (
    <>
      <StylesContainer className='focalboard-body'>
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
          <Box mb={1} display='flex' gap={1}>
            <Tabs textColor='primary' indicatorColor='secondary' value={pageId} sx={{ minHeight: 40 }}>
              {attrs.pageIds.map((_pageId, index) => {
                const _board = boards.find(b => b.id === _pageId);
                return _board ? (
                  <Tab
                    component='div'
                    disableRipple
                    key={_pageId}
                    label={(
                      <Button
                        variant='text'
                        startIcon={<PageIcon icon={pages[_pageId]?.icon} pageType='board' isEditorEmpty={false} />}
                        color={pageId === _pageId ? 'textPrimary' : 'secondary'}
                        sx={{ px: 1.5 }}
                        onClick={() => {
                          if (index !== boardIndex) {
                            setBoardIndex(index);
                          }
                        }}
                      >
                        {_board.title}
                      </Button>
                )}
                    sx={{ p: 0 }}
                    value={_pageId}
                  />
                ) : null;
              })}
            </Tabs>
            <Button
              size='small'
              onClick={() => {
                setIsSelectingSource(true);
              }}
            >New source
            </Button>
          </Box>
          <CenterPanel
            hideBanner
            showHeader
            hideViewTabs
            clientConfig={clientConfig}
            readonly={readOnly}
            board={board}
            setPage={(p) => {
              log.warn('Ignoring update page properties of inline database', p);
            }}
            cards={accessibleCards}
            showCard={showCard}
            activeView={activeView}
            groupByProperty={property}
            dateDisplayProperty={displayProperty}
            views={boardViews}
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
