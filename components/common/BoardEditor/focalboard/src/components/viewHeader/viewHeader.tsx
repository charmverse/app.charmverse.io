import React, { ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Board, IPropertyTemplate } from '../../blocks/board';
import { BoardView } from '../../blocks/boardView';
import { Card } from '../../blocks/card';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import Button from 'components/common/Button';
import { IconButton, Tooltip } from '@mui/material';
import Link from 'components/common/Link';
import { useRouter } from 'next/router';
import ViewTabs from './viewTabs';

import ModalWrapper from '../modalWrapper';
import { mutator } from '../../mutator'

import FilterComponent from './filterComponent';
import NewCardButton from './newCardButton';
import ViewHeaderActionsMenu from './viewHeaderActionsMenu';
import ViewHeaderDisplayByMenu from './viewHeaderDisplayByMenu';
import ViewHeaderSortMenu from './viewHeaderSortMenu';
import { Page } from '@prisma/client';
import { usePages } from 'hooks/usePages';
import { useAppSelector } from '../../store/hooks';
import { getBoardCards, getCurrentBoardTemplates } from '../../store/cards';
import { mutate } from 'swr';

type Props = {
  activeBoard?: Board
  activeView?: BoardView
  views: BoardView[]
  viewsBoardId: string
  cards: Card[]
  groupByProperty?: IPropertyTemplate
  addCard: () => void
  showCard: (cardId?: string) => void;
  // addCardFromTemplate: (cardTemplateId: string) => void
  addCardTemplate: () => void
  editCardTemplate: (cardTemplateId: string) => void
  readonly: boolean
  dateDisplayProperty?: IPropertyTemplate
  addViewButton?: ReactNode
  onViewTabClick?: (viewId: string) => void
  disableUpdatingUrl?: boolean
  maxTabsShown?: number
  onDeleteView?: (viewId: string) => void
  showActionsOnHover?: boolean
  showView: (viewId: string) => void
  embeddedBoardPath?: string
  toggleViewOptions: (enable?: boolean) => void
}

const ViewHeader = (props: Props) => {
  const [showFilter, setShowFilter] = useState(false);
  const router = useRouter();
  const {pages} = usePages();
  const cardTemplates: Card[] = useAppSelector(getCurrentBoardTemplates);

  const views = props.views.filter(view => !view.fields.inline)

  const { maxTabsShown = 3, showView, toggleViewOptions, viewsBoardId, activeBoard, activeView, groupByProperty, cards, dateDisplayProperty } = props;

  const withDisplayBy = activeView?.fields.viewType === 'calendar';
  const withSortBy = activeView?.fields.viewType !== 'calendar';

  const hasFilter = activeView?.fields.filter && activeView?.fields.filter.filters?.length > 0;

  async function addPageFromTemplate(pageId: string) {
    const [blocks] = await mutator.duplicateCard({
      board: props.activeBoard as Board,
      cardId: pageId,
      cardPage: pages[pageId] as Page
    });
    console.log('Created blocks', blocks)
    props.showCard(blocks[0]?.id)
  }

  async function deleteCardTemplate(pageId: string) {
    const card = cardTemplates.find(c => c.id === pageId)
    console.log('Found card', card, 'page', pages[pageId])
    if (card) {
      await mutator.deleteBlock(card, 'delete card');
      mutate(`pages/${card.spaceId}`);
    }
  }


  return (
    <div className={`ViewHeader ${props.showActionsOnHover ? 'hide-actions' : ''}`}>
      <ViewTabs
        onDeleteView={props.onDeleteView}
        onViewTabClick={props.onViewTabClick}
        addViewButton={props.addViewButton}
        views={views}
        readonly={props.readonly}
        showView={showView}
        viewsBoardId={viewsBoardId}
        activeView={activeView}
        disableUpdatingUrl={props.disableUpdatingUrl}
        maxTabsShown={maxTabsShown}
        openViewOptions={() => toggleViewOptions(true)}
      />

      {/* add a view */}

      {!props.readonly && views.length <= maxTabsShown && (
        props.addViewButton
      )}

      <div className='octo-spacer' />

      <div className='view-actions'>

      {!props.readonly && activeView && activeBoard
        && (
          <>

            {/* Display by */}

            {withDisplayBy
              && (
                <ViewHeaderDisplayByMenu
                  properties={activeBoard.fields.cardProperties}
                  activeView={activeView}
                  dateDisplayPropertyName={dateDisplayProperty?.name}
                />
              )}

            {/* Filter */}

            <ModalWrapper>
              <Button
                color={hasFilter ? 'primary' : 'secondary'}
                variant='text'
                size='small'
                sx={{ minWidth: 0 }}
                onClick={() => setShowFilter(true)}
              >
                <FormattedMessage
                  id='ViewHeader.filter'
                  defaultMessage='Filter'
                />
              </Button>
              {showFilter
                && (
                  <FilterComponent
                    board={activeBoard}
                    activeView={activeView}
                    onClose={() => setShowFilter(false)}
                  />
                )}
            </ModalWrapper>

            {/* Sort */}

            {withSortBy
              && (
                <ViewHeaderSortMenu
                  properties={activeBoard.fields.cardProperties}
                  activeView={activeView}
                  orderedCards={cards}
                />
              )}
          </>
        )}

      {/* Search - disabled until we can access page data inside the redux selector */}

      {/* <ViewHeaderSearch/> */}

      {/* Link to view embedded table in full */}
      {props.embeddedBoardPath && (
        <Link href={router.pathname.startsWith('/share') ? `/share/${router.query.pageId?.[0]}/${props.embeddedBoardPath}` : `/${router.query.domain}/${props.embeddedBoardPath}`}>
          <Tooltip title='Open as full page' placement='top'>
            <IconButton style={{ width: '32px' }}><OpenInFullIcon color='secondary' sx={{ fontSize: 14 }} /></IconButton>
          </Tooltip>
        </Link>
      )}

      {/* Options menu */}

      {!props.readonly && activeView
        && (
          <>
            <ViewHeaderActionsMenu onClick={() => toggleViewOptions()} />

            {/* New card button */}
            
            <NewCardButton
              addCard={props.addCard}
              addCardFromTemplate={addPageFromTemplate}
              addCardTemplate={props.addCardTemplate}
              editCardTemplate={props.editCardTemplate}
              showCard={props.showCard}
              deleteCardTemplate={deleteCardTemplate}
              boardId={viewsBoardId}
            />
          </>
        )}
        </div>
    </div>
  );
};

export default React.memo(ViewHeader);
