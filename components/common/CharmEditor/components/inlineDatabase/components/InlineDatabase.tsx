
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { NodeViewProps } from '@bangle.dev/core';
import { getSortedBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { getViewCardsSortedFilteredAndGrouped } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { getClientConfig } from 'components/common/BoardEditor/focalboard/src/store/clientConfig';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getCurrentViewDisplayBy, getCurrentViewGroupBy, getView, getSortedViews } from 'components/common/BoardEditor/focalboard/src/store/views';
import CardDialog from 'components/common/BoardEditor/focalboard/src/components/cardDialog';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import { usePages } from 'hooks/usePages';
import ReactDndProvider from 'components/common/ReactDndProvider';
import FocalBoardPortal from 'components/common/BoardEditor/FocalBoardPortal';
import log from 'lib/log';
import styled from '@emotion/styled';
import { isTruthy } from 'lib/utilities/types';
import Button from 'components/common/Button';

import Link from 'next/link';
import { useRouter } from 'next/router';
import BoardSelection from './BoardSelection';
import ViewSelection from './ViewSelection';

// Lazy load focalboard entrypoint (ignoring the redux state stuff for now)
const CenterPanel = dynamic(() => import('components/common/BoardEditor/focalboard/src/components/centerPanel'), {
  ssr: false
});

const StylesContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing(2)};

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
  pageId: string | null;
  viewId: string | null;
  source: 'board_page' | null;
}

export default function DatabaseView ({ readOnly: readOnlyOverride, node, updateAttrs }: DatabaseViewProps) {

  const [attrs, setAttrs] = useState<DatabaseViewAttrs>(node.attrs as DatabaseViewAttrs);
  const router = useRouter();
  const boards = useAppSelector(getSortedBoards);
  const board = boards.find(b => b.id === attrs.pageId);
  const cards = useAppSelector(getViewCardsSortedFilteredAndGrouped({
    boardId: attrs.pageId || '',
    viewId: attrs.viewId || ''
  }));
  const allViews = useAppSelector(getSortedViews);
  const boardViews = allViews.filter(view => view.parentId === attrs.pageId);
  const activeView = useAppSelector(getView(attrs.viewId || ''));
  const groupByProperty = useAppSelector(getCurrentViewGroupBy);
  const dateDisplayProperty = useAppSelector(getCurrentViewDisplayBy);
  const clientConfig = useAppSelector(getClientConfig);
  const { pages, getPagePermissions } = usePages();
  const [shownCardId, setShownCardId] = useState<string | undefined>('');

  const boardPages = Object.values(pages).filter(p => p?.type === 'board').filter(isTruthy);
  const accessibleCards = cards.filter(card => pages[card.id]);
  const boardPage = board ? pages[board.id] : null;

  const currentPagePermissions = getPagePermissions(attrs.pageId || '');

  function showCard (cardId?: string) {
    setShownCardId(cardId);
  }

  function selectBoard (boardId: string) {
    const _boardViews = allViews.filter(view => view.parentId === boardId);
    const viewId = _boardViews.length === 1 ? _boardViews[0].id : null;
    setAttrs({ source: 'board_page', pageId: boardId, viewId });
  }

  function clearSelection () {
    setAttrs({ viewId: null, pageId: null, source: null });
  }

  function selectView (viewId: string) {
    setAttrs(_attrs => ({ ..._attrs, viewId }));
  }

  useEffect(() => {
    updateAttrs(attrs);
  }, [attrs]);

  if (!board) {
    return <BoardSelection pages={boardPages} onSelect={selectBoard} />;
  }

  if (!activeView) {
    return <ViewSelection views={boardViews} title={board.title} onSelect={selectView} onClickBack={clearSelection} />;
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
        <Box display='flex' justifyContent='space-between'>
          <Button
            color='secondary'
            variant='text'
            sx={{
              h3: {
                textDecoration: 'none',
                mt: 0
              }
            }}
            href={`/${router.query.domain}/${boardPage?.path ?? board.id}`}
            component='span'
          >
            <Typography variant='h3'>
              {board.title || 'Untitled'}
            </Typography>
          </Button>
        </Box>
        <CenterPanel
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
