
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { NodeViewProps } from '@bangle.dev/core';
import { getSortedBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { getViewCardsSortedFilteredAndGrouped } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { getClientConfig } from 'components/common/BoardEditor/focalboard/src/store/clientConfig';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getCurrentBoardViews, getCurrentViewDisplayBy, getCurrentViewGroupBy, getView, getSortedViews, setCurrent as setCurrentView } from 'components/common/BoardEditor/focalboard/src/store/views';
import CardDialog from 'components/common/BoardEditor/focalboard/src/components/cardDialog';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import { usePages } from 'hooks/usePages';
import ReactDndProvider from 'components/common/ReactDndProvider';
import FocalBoardPortal from 'components/common/BoardEditor/FocalBoardPortal';
import log from 'lib/log';
import styled from '@emotion/styled';

import ErrorPage from 'components/common/errors/ErrorPage';

// Lazy load focalboard entrypoint (ignoring the redux state stuff for now)
const CenterPanel = dynamic(() => import('components/common/BoardEditor/focalboard/src/components/centerPanel'), {
  ssr: false
});

const StylesContainer = styled.div`

  .BoardComponent {
    overflow: visible;
  }

  .container-container {
    min-width: 0;
    overflow: auto;
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
`;

interface DatabaseViewProps extends NodeViewProps {
  readOnly?: boolean;
}

interface DatabaseViewAttrs {
  pageId?: string;
  viewId?: string;
}

export default function DatabaseView ({ readOnly: readOnlyOverride }: DatabaseViewProps) {

  const pageId = '38c15b30-5aa9-4b03-9226-2ed5b6263e72';
  // const viewId = '45ff0d07-22d2-4a4c-8513-e92dfcd02d84'; // gallery view
  // const viewId = '4c90e179-3ef4-465f-9162-45817208aa74'; // table
  const viewId = '64634dfc-19c0-4601-a1fc-78178d401655'; // kanban

  const [attrs, setAttrs] = useState<DatabaseViewAttrs>({ viewId, pageId });

  const boards = useAppSelector(getSortedBoards);
  const board = boards.find(b => b.id === attrs.pageId);
  const cards = useAppSelector(getViewCardsSortedFilteredAndGrouped({
    boardId: attrs.pageId || '',
    viewId: attrs.viewId || ''
  }));
  const allViews = useAppSelector(getSortedViews);
  const views = allViews.filter(view => view.parentId === pageId);
  const activeView = useAppSelector(getView(viewId));
  const boardViews = useAppSelector(getCurrentBoardViews);
  const groupByProperty = useAppSelector(getCurrentViewGroupBy);
  const dateDisplayProperty = useAppSelector(getCurrentViewDisplayBy);
  const clientConfig = useAppSelector(getClientConfig);
  const { pages, getPagePermissions } = usePages();
  const accessibleCards = cards.filter(card => pages[card.id]);

  const [shownCardId, setShownCardId] = useState<string | undefined>('');

  const currentPagePermissions = getPagePermissions(pageId);

  function showCard (cardId?: string) {
    setShownCardId(cardId);
  }

  function selectBoard (_pageId: string) {
    setAttrs(_attrs => ({ ..._attrs, pageId: _pageId }));
  }

  function selectView (_viewId: string) {
    setAttrs(_attrs => ({ ..._attrs, viewId: _viewId }));
  }

  // TODO: we might need this if we set a local context for subcomponents
  // useEffect(() => {

  //   if (boardId) {
  //     dispatch(setCurrentBoard(boardId));
  //     dispatch(setCurrentView(viewId || ''));
  //   }

  // }, [boardId, viewId, boardViews]);

  if (!board || !activeView) {
    return <ErrorPage message='Database not found' />;
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
    <ReactDndProvider>
      <StylesContainer className='focalboard-body'>
        <Box mb={1}>
          <Typography variant='h3'>
            {board.title}
          </Typography>
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
    </ReactDndProvider>
  );
}
