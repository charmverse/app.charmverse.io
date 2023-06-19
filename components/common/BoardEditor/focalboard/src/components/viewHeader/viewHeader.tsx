import type { PageMeta } from '@charmverse/core/pages';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box, Menu, Popover, Tooltip } from '@mui/material';
import { bindTrigger, bindPopover, bindMenu } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { mutate } from 'swr';

import Button from 'components/common/Button';
import Link from 'components/common/Link';
import { usePages } from 'hooks/usePages';
import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';

import { mutator } from '../../mutator';
import { getCurrentBoardTemplates } from '../../store/cards';
import { useAppSelector } from '../../store/hooks';
import IconButton from '../../widgets/buttons/iconButton';
import AddViewMenu from '../addViewMenu';

import FilterComponent from './filterComponent';
import NewCardButton from './newCardButton';
import ViewHeaderActionsMenu from './viewHeaderActionsMenu';
import ViewHeaderDisplayByMenu from './viewHeaderDisplayByMenu';
import ViewHeaderSortMenu from './viewHeaderSortMenu';
import ViewTabs from './viewTabs';

type Props = {
  activeBoard?: Board;
  activeView?: BoardView;
  views: BoardView[];
  viewsBoard: Board; // the parent board which keeps track of the views on this page
  cards: Card[];
  addCard: () => void;
  showCard: (cardId: string | null) => void;
  // addCardFromTemplate: (cardTemplateId: string) => void
  addCardTemplate: () => void;
  editCardTemplate: (cardTemplateId: string) => void;
  readOnly: boolean;
  readOnlySourceData: boolean;
  dateDisplayProperty?: IPropertyTemplate;
  disableUpdatingUrl?: boolean;
  maxTabsShown?: number;
  onClickNewView?: () => void;
  onDeleteView?: (viewId: string) => void;
  showActionsOnHover?: boolean;
  showView: (viewId: string) => void;
  embeddedBoardPath?: string;
  toggleViewOptions: (enable?: boolean) => void;
};

function ViewHeader(props: Props) {
  const router = useRouter();
  const { pages, refreshPage } = usePages();
  const cardTemplates: Card[] = useAppSelector(getCurrentBoardTemplates);
  const viewFilterPopup = usePopupState({ variant: 'popover', popupId: 'view-filter' });
  const viewSortPopup = usePopupState({ variant: 'popover', popupId: 'view-sort' });

  const views = props.views.filter((view) => !view.fields.inline);

  const {
    maxTabsShown = 3,
    showView,
    toggleViewOptions,
    viewsBoard,
    activeBoard,
    onClickNewView,
    activeView,
    cards,
    dateDisplayProperty
  } = props;

  const withDisplayBy = activeView?.fields.viewType === 'calendar';
  const withSortBy = activeView?.fields.viewType !== 'calendar';

  const hasFilter = activeView?.fields.filter && activeView?.fields.filter.filters?.length > 0;

  async function addPageFromTemplate(pageId: string) {
    const [blocks] = await mutator.duplicateCard({
      board: activeBoard as Board,
      cardId: pageId,
      cardPage: pages[pageId] as PageMeta
    });
    const newPageId = blocks[0].id;
    await refreshPage(newPageId);
    props.showCard(newPageId);
  }

  async function deleteCardTemplate(pageId: string) {
    const card = cardTemplates.find((c) => c.id === pageId);
    if (card) {
      await mutator.deleteBlock(card, 'delete card');
      mutate(`pages/${card.spaceId}`);
    }
  }

  return (
    <div key={viewsBoard.id} className={`ViewHeader ${props.showActionsOnHover ? 'hide-actions' : ''}`}>
      <ViewTabs
        onDeleteView={props.onDeleteView}
        onClickNewView={onClickNewView}
        board={viewsBoard}
        views={views}
        readOnly={props.readOnly}
        showView={showView}
        activeView={activeView}
        disableUpdatingUrl={props.disableUpdatingUrl}
        maxTabsShown={maxTabsShown}
        openViewOptions={() => toggleViewOptions(true)}
        viewIds={viewsBoard?.fields.viewIds ?? []}
      />

      {/* add a view */}

      {!props.readOnly && views.length <= maxTabsShown && (
        <Box className='view-actions' pt='4px'>
          <AddViewMenu
            board={viewsBoard}
            activeView={activeView}
            views={views}
            showView={showView}
            onClickIcon={onClickNewView}
          />
        </Box>
      )}

      <div className='octo-spacer' />

      <Box
        sx={{ opacity: viewSortPopup.isOpen || viewFilterPopup.isOpen ? '1 !important' : undefined }}
        className='view-actions'
      >
        {!props.readOnly && activeView && (
          <>
            {/* Display by */}

            {withDisplayBy && (
              <ViewHeaderDisplayByMenu
                properties={activeBoard?.fields.cardProperties ?? []}
                activeView={activeView}
                dateDisplayPropertyName={dateDisplayProperty?.name}
              />
            )}

            {/* Filter */}
            <Button
              color={hasFilter ? 'primary' : 'secondary'}
              variant='text'
              size='small'
              sx={{ minWidth: 0 }}
              {...bindTrigger(viewFilterPopup)}
            >
              <FormattedMessage id='ViewHeader.filter' defaultMessage='Filter' />
            </Button>
            <Popover
              {...bindPopover(viewFilterPopup)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              sx={{
                overflow: 'auto'
              }}
            >
              <FilterComponent properties={activeBoard?.fields.cardProperties ?? []} activeView={activeView} />
            </Popover>

            {/* Sort */}

            {withSortBy && (
              <>
                <Button
                  color={activeView.fields.sortOptions?.length > 0 ? 'primary' : 'secondary'}
                  variant='text'
                  size='small'
                  sx={{ minWidth: 0 }}
                  {...bindTrigger(viewSortPopup)}
                >
                  <FormattedMessage id='ViewHeader.sort' defaultMessage='Sort' />
                </Button>
                <Menu
                  {...bindMenu(viewSortPopup)}
                  PaperProps={{
                    sx: {
                      overflow: 'visible'
                    }
                  }}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right'
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                  }}
                  onClick={() => viewSortPopup.close()}
                >
                  <ViewHeaderSortMenu
                    properties={activeBoard?.fields.cardProperties ?? []}
                    activeView={activeView}
                    orderedCards={cards}
                  />
                </Menu>
              </>
            )}
          </>
        )}

        {/* Search - disabled until we can access page data inside the redux selector */}

        {/* <ViewHeaderSearch/> */}

        {/* Link to view embedded table in full */}
        {props.embeddedBoardPath && (
          <Link href={`/${router.query.domain}/${props.embeddedBoardPath}`}>
            <Tooltip title='Open as full page' placement='top'>
              <span>
                <IconButton
                  icon={<OpenInFullIcon color='secondary' sx={{ fontSize: 14 }} />}
                  style={{ width: '32px' }}
                />
              </span>
            </Tooltip>
          </Link>
        )}

        {/* Options menu */}

        {!props.readOnly && activeView && (
          <>
            <ViewHeaderActionsMenu onClick={() => toggleViewOptions()} />

            {/* New card button */}

            {!props.readOnlySourceData && (
              <NewCardButton
                addCard={props.addCard}
                addCardFromTemplate={addPageFromTemplate}
                addCardTemplate={props.addCardTemplate}
                editCardTemplate={props.editCardTemplate}
                showCard={props.showCard}
                deleteCardTemplate={deleteCardTemplate}
                boardId={viewsBoard.id}
              />
            )}
          </>
        )}
      </Box>
    </div>
  );
}

export default React.memo(ViewHeader);
