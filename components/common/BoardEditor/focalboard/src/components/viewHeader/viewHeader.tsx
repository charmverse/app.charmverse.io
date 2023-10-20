import type { PageMeta } from '@charmverse/core/pages';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box, Menu, Popover, Tooltip } from '@mui/material';
import { bindTrigger, bindPopover, bindMenu } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { mutate } from 'swr';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { ViewSortControl } from 'components/common/BoardEditor/components/ViewSortControl';
import { Button } from 'components/common/Button';
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
  currentRootPageId: string; // The current page ID from which this header is being viewed (Could be the database ID, or a page ID if this is an inline database )
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
  dateDisplayProperty?: IPropertyTemplate;
  disableUpdatingUrl?: boolean;
  maxTabsShown?: number;
  onClickNewView?: () => void;
  onDeleteView?: (viewId: string) => void;
  showActionsOnHover?: boolean;
  showView: (viewId: string) => void;
  embeddedBoardPath?: string;
  toggleViewOptions: (open?: boolean) => void;
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
    currentRootPageId,
    onClickNewView,
    activeView,
    cards,
    dateDisplayProperty
  } = props;

  const { trigger: updateProposalSource } = useSWRMutation(
    `/api/pages/${activeBoard?.id}/proposal-source`,
    (_url, { arg }: Readonly<{ arg: { pageId: string } }>) => charmClient.updateProposalSource(arg)
  );
  useEffect(() => {
    if (currentRootPageId && activeBoard?.fields.sourceType === 'proposals' && activeBoard?.id === currentRootPageId) {
      updateProposalSource({ pageId: currentRootPageId });
    }
  }, [currentRootPageId, activeBoard?.id]);

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
        // hide the add view button if there are no views yet many views
        <Box className='view-actions' pt='4px' sx={{ opacity: views.length === 0 ? '0 !important' : 1 }}>
          <AddViewMenu
            board={viewsBoard}
            activeView={activeView}
            views={views}
            showView={showView}
            onClick={onClickNewView}
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
              <ViewSortControl
                activeBoard={activeBoard}
                activeView={activeView}
                cards={cards}
                viewSortPopup={viewSortPopup}
              />
            )}
          </>
        )}

        {/* Search - disabled until we can access page data inside the redux selector */}

        {/* <ViewHeaderSearch/> */}

        {/* Link to view embedded table in full - check that at least one view is created */}
        {props.embeddedBoardPath && !!views.length && (
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

            {activeBoard?.fields.sourceType !== 'proposals' && (
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
