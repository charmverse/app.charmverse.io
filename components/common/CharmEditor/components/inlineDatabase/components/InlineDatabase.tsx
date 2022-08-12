
import dynamic from 'next/dynamic';
import { Page } from 'models';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { NodeViewProps } from '@bangle.dev/core';
import { useHotkeys } from 'react-hotkeys-hook';
import CenterPanel from 'components/common/BoardEditor/focalboard/src/components/centerPanel';
import { sendFlashMessage, FlashMessages } from 'components/common/BoardEditor/focalboard/src/components/flashMessages';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import { getBoard } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { getCurrentViewCardsSortedFilteredAndGrouped } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { getClientConfig } from 'components/common/BoardEditor/focalboard/src/store/clientConfig';
import { useAppDispatch, useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { initialReadOnlyLoad } from 'components/common/BoardEditor/focalboard/src/store/initialLoad';
import { getCurrentBoardViews, getCurrentViewDisplayBy, getCurrentViewGroupBy, getView, getSortedViews, setCurrent as setCurrentView } from 'components/common/BoardEditor/focalboard/src/store/views';
import { Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import CardDialog from 'components/common/BoardEditor/focalboard/src/components/cardDialog';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import { silentlyUpdateURL } from 'lib/browser';
import { usePages } from 'hooks/usePages';
import ReactDndProvider from 'components/common/ReactDndProvider';
import FocalBoardPortal from 'components/common/BoardEditor/FocalBoardPortal';
import log from 'lib/log';
import styled from '@emotion/styled';

import ErrorPage from 'components/common/errors/ErrorPage';

const StylesContainer = styled.div`
  .container-container {
    padding: 0;
  }

  // remove extra padding on Table view
  .Table {
    margin-top: 0;
  }

  // remove extra padding on Kanban view
  .octo-board-header {
    padding-top: 0;
  }
`;

// TODO: Lazy load focalboard
// const BoardEditor = dynamic(() => import('components/common/BoardEditor/focalboard/src/components/centerPanel'), {
//   ssr: false
// });

interface DatabaseViewProps extends NodeViewProps {
  readOnly?: boolean
}

export default function DatabaseView ({ readOnly: readOnlyOverride }: DatabaseViewProps) {

  const pageId = '38c15b30-5aa9-4b03-9226-2ed5b6263e72';
  // const viewId = '45ff0d07-22d2-4a4c-8513-e92dfcd02d84'; // gallery view
  //  const viewId = '4c90e179-3ef4-465f-9162-45817208aa74'; // table
  const viewId = '64634dfc-19c0-4601-a1fc-78178d401655'; // kanban
  const board = useAppSelector(getBoard(pageId));
  const cards = useAppSelector(getCurrentViewCardsSortedFilteredAndGrouped);
  const allViews = useAppSelector(getSortedViews);
  const views = allViews.filter(view => view.parentId === pageId);
  const activeView = useAppSelector(getView(viewId));
  const boardViews = useAppSelector(getCurrentBoardViews);
  const groupByProperty = useAppSelector(getCurrentViewGroupBy);
  const dateDisplayProperty = useAppSelector(getCurrentViewDisplayBy);
  const clientConfig = useAppSelector(getClientConfig);
  const { pages, getPagePermissions } = usePages();
  const accessibleCards = useMemo(() => cards.filter(card => pages[card.id]), [cards, Object.keys(pages).toString()]);

  const [shownCardId, setShownCardId] = useState<string | undefined>('');

  const currentPagePermissions = getPagePermissions(pageId);

  function showCard (cardId?: string) {
    setShownCardId(cardId);
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
      <StylesContainer>
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
      <FlashMessages milliseconds={2000} />
      <FocalBoardPortal />
    </ReactDndProvider>
  );
}
