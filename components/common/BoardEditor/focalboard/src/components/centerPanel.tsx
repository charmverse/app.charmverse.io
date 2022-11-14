/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-lines */
import CallMadeIcon from '@mui/icons-material/CallMade';
import { Box } from '@mui/material';
import type { Page } from '@prisma/client';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useState } from 'react';
import Hotkeys from 'react-hot-keys';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import type { ConnectedProps } from 'react-redux';
import { connect } from 'react-redux';
import { mutate } from 'swr';

import charmClient from 'charmClient';
import PageBanner, { randomBannerImage } from 'components/[pageId]/DocumentPage/components/PageBanner';
import PageDeleteBanner from 'components/[pageId]/DocumentPage/components/PageDeleteBanner';
import { getBoard } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { getViewCardsSortedFilteredAndGrouped } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getCurrentViewDisplayBy, getCurrentViewGroupBy } from 'components/common/BoardEditor/focalboard/src/store/views';
import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { createBoardView } from 'lib/focalboard/boardView';
import { convertToInlineBoard } from 'lib/pages/convertToInlineBoard';

import { BlockIcons } from '../blockIcons';
import type { Block } from '../blocks/block';
import type { Board, BoardGroup, IPropertyOption, IPropertyTemplate } from '../blocks/board';
import type { BoardView } from '../blocks/boardView';
import type { Card } from '../blocks/card';
import { createCard } from '../blocks/card';
import { CardFilter } from '../cardFilter';
import mutator from '../mutator';
import { addCard as _addCard, addTemplate } from '../store/cards';
import { updateView } from '../store/views';
import { UserSettings } from '../userSettings';
import { Utils } from '../utils';

import AddViewMenu from './addViewMenu';
import Gallery from './gallery/gallery';
import Kanban from './kanban/kanban';
import SourceSelection from './SourceSelection';
import Table from './table/table';
import ViewHeader from './viewHeader/viewHeader';
import ViewSidebar from './viewSidebar/viewSidebar';
import ViewTitle, { InlineViewTitle } from './viewTitle';

const CalendarFullView = dynamic(() => import('./calendar/fullCalendar'), { ssr: false });

// eslint-disable-next-line no-use-before-define
type Props = WrappedComponentProps & PropsFromRedux & {
  board: Board;
  embeddedBoardPath?: string;
  // cards: Card[]
  activeView?: BoardView;
  views: BoardView[];
  hideBanner?: boolean;
  readOnly: boolean;
  addCard: (card: Card) => void;
  setPage: (p: Partial<Page>) => void;
  updateView: (view: BoardView) => void;
  showCard: (cardId: string | null) => void;
  onViewTabClick?: (viewId: string) => void;
  disableUpdatingUrl?: boolean;
  maxTabsShown?: number;
  onDeleteView?: (viewId: string) => void;
}

type State = {
  selectedCardIds: string[];
  cardIdToFocusOnRender: string;
  showSettings: 'create-linked-view' | 'view-options' | null;
}

function CenterPanel (props: Props) {

  const { activeView, board, views } = props;

  const [state, setState] = useState<State>({
    cardIdToFocusOnRender: '',
    selectedCardIds: [],
    // assume this is a page type 'inline_linked_board' if no view exists
    showSettings: !props.activeView ? 'create-linked-view' : null
  });

  const router = useRouter();
  const space = useCurrentSpace();
  const { pages, updatePage } = usePages();
  const _groupByProperty = useAppSelector(getCurrentViewGroupBy);
  const _dateDisplayProperty = useAppSelector(getCurrentViewDisplayBy);

  const isEmbedded = !!props.embeddedBoardPath;
  const boardPageType = pages[board.id]?.type;

  // for 'linked' boards, each view has its own board which we use to determine the cards to show
  const activeBoardId = props.activeView && (props.activeView?.fields.linkedSourceId || props.board.id);
  const activeBoard = useAppSelector(getBoard(activeBoardId));
  const activePage = pages[activeBoardId];

  const _cards = useAppSelector(getViewCardsSortedFilteredAndGrouped({
    boardId: activeBoard?.id || '',
    viewId: activeView?.id || ''
  }));
  // filter cards by whats accessible
  const cards = _cards.filter(card => pages[card.id]);

  let groupByProperty = _groupByProperty;
  if ((!groupByProperty || _groupByProperty?.type !== 'select') && activeView?.fields.viewType === 'board') {
    groupByProperty = activeBoard?.fields.cardProperties.find((o: any) => o.type === 'select');
  }

  let dateDisplayProperty = _dateDisplayProperty;
  if (!dateDisplayProperty && activeView?.fields.viewType === 'calendar') {
    dateDisplayProperty = activeBoard?.fields.cardProperties.find((o: any) => o.type === 'date');
  }

  const { visible: visibleGroups, hidden: hiddenGroups } = activeView
    ? getVisibleAndHiddenGroups(cards, activeView.fields.visibleOptionIds, activeView.fields.hiddenOptionIds, groupByProperty)
    : { visible: [], hidden: [] };

  const backgroundRef = React.createRef<HTMLDivElement>();
  const keydownHandler = (keyName: string, e: KeyboardEvent) => {
    if (e.target !== document.body || props.readOnly) {
      return;
    }

    if (keyName === 'esc') {
      if (state.selectedCardIds.length > 0) {
        setState({ ...state, selectedCardIds: [] });
        e.stopPropagation();
      }
    }

    if (state.selectedCardIds.length > 0) {
      if (keyName === 'del' || keyName === 'backspace') {
        // Backspace or Del: Delete selected cards
        deleteSelectedCards();
        e.stopPropagation();
      }

    }
  };

  function setRandomHeaderImage (_board: Board, headerImage?: string | null) {
    const newHeaderImage = headerImage ?? randomBannerImage();
    // Null is passed if we want to remove the image
    mutator.changeHeaderImage(_board.id, _board.fields.headerImage, headerImage !== null ? newHeaderImage : null);
  }

  function backgroundClicked (e: React.MouseEvent) {
    if (state.selectedCardIds.length > 0) {
      setState({ ...state, selectedCardIds: [] });
      e.stopPropagation();
    }
  }

  const showCard = React.useCallback((cardId: string | null) => {
    if (state.selectedCardIds.length > 0) {
      setState({ ...state, selectedCardIds: [] });
    }
    props.showCard(cardId);
  }, [props.showCard, state.selectedCardIds]);

  const addCard = async (groupByOptionId?: string, show = false, properties: Record<string, string> = {}, insertLast = true, isTemplate = false) => {
    const { activeView, board } = props;

    if (!activeView) {
      throw new Error('No active view');
    }

    const card = createCard();

    // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateCard, {board: board.id, view: activeView.id, card: card.id})

    card.parentId = board.id;
    card.rootId = board.rootId;
    const propertiesThatMeetFilters = CardFilter.propertiesThatMeetFilterGroup(activeView.fields.filter, board.fields.cardProperties);
    if ((activeView.fields.viewType === 'board' || activeView.fields.viewType === 'table') && groupByProperty) {
      if (groupByOptionId) {
        propertiesThatMeetFilters[groupByProperty.id] = groupByOptionId;
      }
      else {
        delete propertiesThatMeetFilters[groupByProperty.id];
      }
    }
    card.fields.properties = { ...card.fields.properties, ...properties, ...propertiesThatMeetFilters };
    if (!card.fields.icon && UserSettings.prefillRandomIcons) {
      card.fields.icon = BlockIcons.shared.randomIcon();
    }

    card.fields.contentOrder = [];
    card.fields.isTemplate = isTemplate;

    mutator.performAsUndoGroup(async () => {
      const newCardOrder = insertLast ? [...activeView.fields.cardOrder, card.id] : [card.id, ...activeView.fields.cardOrder];
      // update view order first so that when we add the block it appears in the right spot
      await mutator.changeViewCardOrder(activeView, newCardOrder, 'add-card');

      await mutator.insertBlock(
        card,
        'add card',
        async (block: Block) => {
          if (space) {
            await mutate(`pages/${space.id}`, async (_pages: Record<string, Page>): Promise<Record<string, Page>> => {
              const newPage = await charmClient.pages.getPage(block.id);

              return { ..._pages, [newPage.id]: newPage };
            }, {
              revalidate: false
            });
          }

          if (isTemplate) {
            showCard(block.id);
          }
          else if (show) {
            props.addCard(createCard(block));
            props.updateView({ ...activeView, fields: { ...activeView.fields, cardOrder: newCardOrder } });
            showCard(block.id);
          }
          else {
            // Focus on this card's title inline on next render
            setState({ ...state, cardIdToFocusOnRender: card.id });
            setTimeout(() => setState({ ...state, cardIdToFocusOnRender: '' }), 100);
          }
        },
        async () => {
          showCard(null);
        }
      );
    });
  };

  const editCardTemplate = (cardTemplateId: string) => {
    showCard(cardTemplateId);
  };

  const cardClicked = (e: React.MouseEvent, card: Card): void => {
    const { activeView } = props;

    if (!activeView) {
      return;
    }

    if (e.shiftKey) {
      let selectedCardIds = state.selectedCardIds.slice();
      if (selectedCardIds.length > 0 && (e.metaKey || e.ctrlKey)) {
        // Cmd+Shift+Click: Extend the selection
        const orderedCardIds = cards.map((o) => o.id);
        const lastCardId = selectedCardIds[selectedCardIds.length - 1];
        const srcIndex = orderedCardIds.indexOf(lastCardId);
        const destIndex = orderedCardIds.indexOf(card.id);
        const newCardIds = (srcIndex < destIndex) ? orderedCardIds.slice(srcIndex, destIndex + 1) : orderedCardIds.slice(destIndex, srcIndex + 1);
        for (const newCardId of newCardIds) {
          if (!selectedCardIds.includes(newCardId)) {
            selectedCardIds.push(newCardId);
          }
        }
        setState({ ...state, selectedCardIds });
      }
      else {
        // Shift+Click: add to selection
        if (selectedCardIds.includes(card.id)) {
          selectedCardIds = selectedCardIds.filter((o) => o !== card.id);
        }
        else {
          selectedCardIds.push(card.id);
        }
        setState({ ...state, selectedCardIds });
      }
    }
    else if (activeView.fields.viewType === 'board' || activeView.fields.viewType === 'gallery') {
      showCard(card.id);
    }

    e.stopPropagation();
  };

  async function deleteSelectedCards () {
    const { selectedCardIds } = state;
    if (selectedCardIds.length < 1) {
      return;
    }

    mutator.performAsUndoGroup(async () => {
      for (const cardId of selectedCardIds) {
        const card = cards.find((o) => o.id === cardId);
        if (card) {
          mutator.deleteBlock(card, selectedCardIds.length > 1 ? `delete ${selectedCardIds.length} cards` : 'delete card');
        }
        else {
          Utils.assertFailure(`Selected card not found: ${cardId}`);
        }
      }
    });

    setState({ ...state, selectedCardIds: [] });
  }

  function getVisibleAndHiddenGroups (__cards: Card[], visibleOptionIds: string[], hiddenOptionIds: string[], groupByProperty?: IPropertyTemplate):
    { visible: BoardGroup[], hidden: BoardGroup[] } {
    let unassignedOptionIds: string[] = [];
    if (groupByProperty) {
      unassignedOptionIds = groupByProperty.options
        .filter((o: IPropertyOption) => !visibleOptionIds.includes(o.id) && !hiddenOptionIds.includes(o.id))
        .map((o: IPropertyOption) => o.id);
    }
    const allVisibleOptionIds = [...visibleOptionIds, ...unassignedOptionIds];

    // If the empty group position is not explicitly specified, make it the first visible column
    if (!allVisibleOptionIds.includes('') && !hiddenOptionIds.includes('')) {
      allVisibleOptionIds.unshift('');
    }

    const _visibleGroups = groupCardsByOptions(__cards, allVisibleOptionIds, groupByProperty);
    const _hiddenGroups = groupCardsByOptions(__cards, hiddenOptionIds, groupByProperty);
    return { visible: _visibleGroups, hidden: _hiddenGroups };
  }

  const showView = useCallback((viewId) => {
    if (!props.disableUpdatingUrl) {
      router.push({
        pathname: router.pathname,
        query: {
          ...router.query,
          viewId: viewId || ''
        }
      }, undefined, { shallow: true });
    }
    props.onViewTabClick?.(viewId);
  }, [router.query, typeof window !== 'undefined' && window.history]);

  async function createLinkedView ({ boardId: sourceBoardId }: { boardId: string }) {
    const view = createBoardView();
    view.fields.viewType = 'board';
    view.parentId = board.id;
    view.rootId = board.id;
    view.title = 'Board view';
    // A new property to indicate that this view was creating for inline databases only
    view.fields.sourceType = 'board_page';
    view.fields.linkedSourceId = sourceBoardId;
    await mutator.insertBlock(view);
    showView(view.id);
  }

  async function createDatabase () {
    const { view } = await convertToInlineBoard({ board, updatePage });
    showView(view.id);
  }

  function openSelectSource () {
    // delay the sidebar opening so that we dont trigger it to close right away
    setTimeout(() => {
      setState({ ...state, showSettings: 'create-linked-view' });
    });
    props.onViewTabClick?.('');
  }

  function toggleViewOptions (enable?: boolean) {
    enable = enable ?? state.showSettings !== 'view-options';
    const showSettings = enable ? 'view-options' : null;
    // delay the sidebar opening so that we dont trigger it to close right away
    setTimeout(() => {
      setState({ ...state, showSettings });
    });
  }

  function closeSettings () {
    setState({ ...state, showSettings: null });
  }

  // close settings once a view has been added
  useEffect(() => {
    if (activeView) {
      closeSettings();
    }
  }, [activeView?.id]);

  return (
    <div
      className={`BoardComponent ${isEmbedded ? 'embedded-board' : ''}`}
      ref={backgroundRef}
      onClick={(e) => {
        backgroundClicked(e);
      }}
    >
      <Hotkeys
        keyName='ctrl+d,del,esc,backspace'
        onKeyDown={keydownHandler}
      />
      {!!board.deletedAt && <PageDeleteBanner pageId={board.id} />}
      {!props.hideBanner && board.fields.headerImage && (
        <Box className='PageBanner' width='100%' mb={2}>
          <PageBanner
            focalBoard
            headerImage={board.fields.headerImage}
            readOnly={props.readOnly}
            setPage={({ headerImage }) => setRandomHeaderImage(board, headerImage!)}
          />
        </Box>
      )}
      <div className='top-head'>
        {(board && (boardPageType === 'board' || !isEmbedded)) && (
          <ViewTitle
            key={board.id + board.title}
            board={board}
            readOnly={props.readOnly}
            setPage={props.setPage}
          />
        )}
        <ViewHeader
          onDeleteView={props.onDeleteView}
          maxTabsShown={props.maxTabsShown}
          disableUpdatingUrl={props.disableUpdatingUrl}
          onViewTabClick={props.onViewTabClick}
          addViewButton={(
            <AddViewMenu
              board={board}
              activeView={activeView}
              views={views}
              showView={showView}
              onClick={(boardPageType === 'inline_linked_board') ? openSelectSource : undefined}
            />
          )}
          viewsBoardId={board.id}
          activeBoard={activeBoard}
          activeView={props.activeView}
          toggleViewOptions={toggleViewOptions}
          cards={cards}
          views={props.views}
          groupByProperty={groupByProperty}
          dateDisplayProperty={dateDisplayProperty}
          addCard={() => addCard('', true)}
          showCard={showCard}
          showView={showView}
          // addCardFromTemplate={addCardFromTemplate}
          addCardTemplate={() => addCard('', true, {}, false, true)}
          editCardTemplate={editCardTemplate}
          readOnly={props.readOnly}
          embeddedBoardPath={props.embeddedBoardPath}
        />
      </div>

      <div className={`container-container ${state.showSettings ? 'sidebar-visible' : ''}`}>
        <Box display='flex'>
          <Box width='100%'>
            {activeBoard && activePage && isEmbedded && boardPageType === 'inline_board' && (
              <InlineViewTitle
                key={activePage.id + activePage.title}
                board={activeBoard}
                readOnly={props.readOnly}
                setPage={props.setPage}
              />
            )}
            {activePage && boardPageType === 'inline_linked_board' && (
              <Button
                color='secondary'
                startIcon={<CallMadeIcon />}
                variant='text'
                size='large'
                href={`${router.pathname.startsWith('/share') ? '/share' : ''}/${space?.domain}/${activePage?.path}`}
                sx={{ fontSize: 22, fontWeight: 700, py: 0 }}
              >
                {activePage.title || 'Untitled'}
              </Button>
            )}
            {!activeView && state.showSettings === 'create-linked-view' && (
              <SourceSelection
                readOnly={props.readOnly}
                onSelectSource={createLinkedView}
                onCreateDatabase={createDatabase}
                showCreateDatabase={views.length === 0}
              />
            )}
            {activeBoard && activeView?.fields.viewType === 'board' && (
              <Kanban
                board={activeBoard}
                activeView={activeView}
                cards={cards}
                groupByProperty={groupByProperty}
                visibleGroups={visibleGroups}
                hiddenGroups={hiddenGroups}
                selectedCardIds={state.selectedCardIds}
                readOnly={props.readOnly}
                onCardClicked={cardClicked}
                addCard={addCard}
                showCard={showCard}
              />
            )}
            {activeBoard && activeView?.fields.viewType === 'table' && (
              <Table
                board={activeBoard}
                activeView={activeView}
                cards={cards}
                groupByProperty={groupByProperty}
                views={props.views}
                visibleGroups={visibleGroups}
                selectedCardIds={state.selectedCardIds}
                readOnly={props.readOnly}
                cardIdToFocusOnRender={state.cardIdToFocusOnRender}
                showCard={showCard}
                addCard={addCard}
                onCardClicked={cardClicked}
              />
            )}
            {activeBoard && activeView?.fields.viewType === 'calendar' && (
              <CalendarFullView
                board={activeBoard}
                cards={cards}
                activeView={activeView}
                readOnly={props.readOnly}
                dateDisplayProperty={dateDisplayProperty}
                showCard={showCard}
                addCard={(properties: Record<string, string>) => {
                  addCard('', true, properties);
                }}
              />
            )}

            {activeBoard && activeView?.fields.viewType === 'gallery' && (
              <Gallery
                board={activeBoard}
                cards={cards}
                activeView={activeView}
                readOnly={props.readOnly}
                onCardClicked={cardClicked}
                selectedCardIds={state.selectedCardIds}
                addCard={(show) => addCard('', show)}
              />
            )}
          </Box>
          {activeBoard && activeView && (
            <ViewSidebar board={activeBoard} view={activeView} isOpen={state.showSettings === 'view-options'} closeSidebar={closeSettings} groupByProperty={groupByProperty} />
          )}
        </Box>
      </div>
    </div>
  );

}

export function groupCardsByOptions (cards: Card[], optionIds: string[], groupByProperty?: IPropertyTemplate): BoardGroup[] {
  const groups = [];

  for (const optionId of optionIds) {
    if (optionId) {
      const option = groupByProperty?.options.find((o) => o.id === optionId);
      if (option) {
        const c = cards.filter((o) => optionId === o.fields.properties[groupByProperty!.id]);
        const group: BoardGroup = {
          option,
          cards: c
        };
        groups.push(group);
      }
    }
    else {
      // Empty group
      const emptyGroupCards = cards.filter((card) => {
        const groupByOptionId = card.fields.properties[groupByProperty?.id || ''];
        return !groupByOptionId || !groupByProperty?.options.find((option) => option.id === groupByOptionId);
      });
      const group: BoardGroup = {
        option: { id: '', value: `No ${groupByProperty?.name}`, color: '' },
        cards: emptyGroupCards
      };
      groups.push(group);
    }
  }
  return groups;
}

const connector = connect(undefined, { addCard: _addCard, addTemplate, updateView });

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(injectIntl(CenterPanel));
