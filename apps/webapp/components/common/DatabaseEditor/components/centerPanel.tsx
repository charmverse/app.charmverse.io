/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-lines */

import type { PageMeta } from '@charmverse/core/pages';
import type { Page } from '@charmverse/core/prisma';
import CallMadeIcon from '@mui/icons-material/CallMade';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import { Box, Link, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { webhookEndpoint } from '@packages/config/constants';
import type { UIBlockWithDetails } from '@packages/databases/block';
import type { Board, BoardGroup, IPropertyOption, IPropertyTemplate } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';
import type { Card } from '@packages/databases/card';
import { createCard } from '@packages/databases/card';
import { CardFilter } from '@packages/databases/cardFilter';
import mutator from '@packages/databases/mutator';
import { makeSelectBoard } from '@packages/databases/store/boards';
import {
  makeSelectViewCardsSortedFilteredAndGrouped,
  sortCards,
  addCard as _addCard,
  addTemplate,
  getAllCards
} from '@packages/databases/store/cards';
import { initialDatabaseLoad } from '@packages/databases/store/databaseBlocksLoad';
import { useAppDispatch, useAppSelector } from '@packages/databases/store/hooks';
import { updateView } from '@packages/databases/store/views';
import { Utils } from '@packages/databases/utils';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Hotkeys from 'react-hot-keys';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import type { ConnectedProps } from 'react-redux';
import { connect } from 'react-redux';

import charmClient from 'charmClient';
import { useGetPageMeta } from 'charmClient/hooks/pages';
import PageBanner, { randomBannerImage } from 'components/[pageId]/DocumentPage/components/PageBanner';
import PageDeleteBanner from 'components/[pageId]/DocumentPage/components/PageDeleteBanner';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { useApiPageKeys } from 'hooks/useApiPageKeys';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';
import { useMembers } from 'hooks/useMembers';

import { CreateLinkedView } from './createLinkedView';
import Gallery from './gallery/gallery';
import Kanban from './kanban/kanban';
import { PageWebhookBanner } from './PageWebhookBanner';
import Table from './table/table';
import ViewHeader from './viewHeader/viewHeader';
import ViewSidebar from './viewSidebar/viewSidebar';
import ViewTitle, { InlineViewTitle } from './viewTitle';

const CalendarFullView = dynamic(() => import('./calendar/fullCalendar'), { ssr: false });

type Props = WrappedComponentProps &
  // eslint-disable-next-line no-use-before-define
  PropsFromRedux & {
    board: Board;
    currentRootPageId: string;
    embeddedBoardPath?: string;
    activeView?: BoardView;
    views: BoardView[];
    hideBanner?: boolean;
    readOnly: boolean;
    addCard: (card: Card) => void;
    pageIcon?: string | null;
    setPage: (p: Partial<Page>) => void;
    updateView: (view: BoardView) => void;
    showCard: (
      cardId: string | null,
      isTemplate?: boolean,
      event?: React.MouseEvent<HTMLButtonElement, globalThis.MouseEvent>
    ) => void;
    showView: (viewId: string) => void;
    disableUpdatingUrl?: boolean;
    maxTabsShown?: number;
    onDeleteView?: (viewId: string) => void;
    page?: PageMeta;
  };

type State = {
  selectedCardIds: string[];
  cardIdToFocusOnRender: string;
  openSettings: 'create-linked-view' | 'view-options' | null;
};

function CenterPanel(props: Props) {
  const { activeView, board, currentRootPageId, pageIcon, showView, views, page: boardPage } = props;
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<null | string>(null);

  const [state, setState] = useState<State>({
    cardIdToFocusOnRender: '',
    selectedCardIds: [],
    // assume this is a page type 'inline_linked_board' or 'linked_board' if no view exists
    openSettings: null
  });

  const [loadingFormResponses, setLoadingFormResponses] = useState(false);

  const router = useRouter();
  const { space } = useCurrentSpace();
  const { membersRecord } = useMembers();
  const localViewSettings = useLocalDbViewSettings(activeView?.id);
  const dispatch = useAppDispatch();
  const isEmbedded = !!props.embeddedBoardPath;
  const boardPageType = boardPage?.type;
  // for 'linked' boards, each view has its own board which we use to determine the cards to show
  let activeBoardId: string | undefined = board.id;
  if (activeView?.fields.linkedSourceId) {
    activeBoardId = activeView?.fields.linkedSourceId;
  } else if (activeView?.fields.sourceType === 'google_form') {
    activeBoardId = activeView?.fields.sourceData?.boardId;
  }

  const { data: activePage } = useGetPageMeta(activeBoardId);
  const { keys } = useApiPageKeys(props.page?.id);
  const cardMap = useAppSelector(getAllCards);
  const selectBoard = useMemo(makeSelectBoard, []);
  const activeBoard = useAppSelector((state) => selectBoard(state, activeBoardId ?? ''));
  const _groupByProperty = activeBoard?.fields.cardProperties.find((o) => o.id === activeView?.fields.groupById);
  const _dateDisplayProperty = activeBoard?.fields.cardProperties.find(
    (o) => o.id === activeView?.fields.dateDisplayPropertyId
  );

  const selectViewCardsSortedFilteredAndGrouped = useMemo(makeSelectViewCardsSortedFilteredAndGrouped, []);
  const _cards = useAppSelector((state) =>
    selectViewCardsSortedFilteredAndGrouped(state, {
      boardId: activeBoard?.id || '',
      viewId: activeView?.id || '',
      localFilters: localViewSettings?.localFilters
    })
  );
  const isActiveView = !!(activeView && activeBoard);

  useEffect(() => {
    if (!isActiveView) {
      return;
    }
    if (selectedPropertyId) {
      setState((s) => ({ ...s, openSettings: 'view-options' }));
    } else if (views.length === 0) {
      setState((s) => ({ ...s, openSettings: 'create-linked-view' }));
    } else if (activeView) {
      setState((s) => ({ ...s, openSettings: null }));
    }
  }, [activeView?.id, views.length, isActiveView, selectedPropertyId]);

  // load the linked board and its subtree when a view links to it
  useEffect(() => {
    if (!activeBoard && activeView?.fields.linkedSourceId) {
      dispatch(initialDatabaseLoad({ pageId: activeView.fields.linkedSourceId }));
    }
  }, [!!activeBoard, activeView?.fields.linkedSourceId]);

  // filter cards by whats accessible
  const { sortedCards, cardIds } = useMemo(() => {
    const result = _cards;

    const _sortedCards = isActiveView
      ? sortCards(
          result,
          activeBoard,
          activeView,
          membersRecord,
          // Required to sort cards by relation properties
          cardMap,
          localViewSettings?.localSort
        )
      : [];

    const _cardIds = new Set<string>();
    _sortedCards.forEach((cardPage) => _cardIds.add(cardPage.id));

    return {
      sortedCards: _sortedCards,
      cardIds: _cardIds
    };
  }, [isActiveView, _cards, localViewSettings?.localSort, cardMap]);

  // Make sure the checkedIds are still cards that exist
  useEffect(() => {
    setCheckedIds((checkedIds) => checkedIds.filter((id) => cardIds.has(id)));
  }, [cardIds.size]);

  let groupByProperty = _groupByProperty;
  if (
    (!groupByProperty ||
      (_groupByProperty?.type !== 'select' &&
        _groupByProperty?.type !== 'proposalStatus' &&
        _groupByProperty?.type !== 'proposalStep')) &&
    activeView?.fields.viewType === 'board'
  ) {
    groupByProperty = activeBoard?.fields.cardProperties.find((o: any) => o.type === 'select');
  }
  let dateDisplayProperty = _dateDisplayProperty;
  if (!dateDisplayProperty && activeView?.fields.viewType === 'calendar') {
    dateDisplayProperty = activeBoard?.fields.cardProperties.find((o: any) => o.type === 'date');
  }

  const { visible: visibleGroups, hidden: hiddenGroups } = useMemo(
    () =>
      activeView
        ? getVisibleAndHiddenGroups(
            sortedCards,
            activeView.fields.visibleOptionIds,
            activeView.fields.hiddenOptionIds,
            groupByProperty
          )
        : { visible: [], hidden: [] },
    [sortedCards, activeView, groupByProperty]
  );

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

  function setRandomHeaderImage(_board: Board, headerImage?: string | null) {
    const newHeaderImage = headerImage ?? randomBannerImage();
    // Null is passed if we want to remove the image
    mutator.changeHeaderImage(_board.id, _board.fields.headerImage, headerImage !== null ? newHeaderImage : null);
  }

  function backgroundClicked(e: React.MouseEvent) {
    if (state.selectedCardIds.length > 0) {
      setState({ ...state, selectedCardIds: [] });
      e.stopPropagation();
    }
  }

  const showCard = useCallback(
    (
      cardId: string | null,
      isTemplate?: boolean,
      event?: React.MouseEvent<HTMLButtonElement, globalThis.MouseEvent>
    ) => {
      if (state.selectedCardIds.length > 0) {
        setState({ ...state, selectedCardIds: [] });
      }
      props.showCard(cardId, isTemplate, event);
    },
    [props.showCard, state.selectedCardIds]
  );

  const __addCard = props.addCard;
  const _updateView = props.updateView;

  const addCard = useCallback(
    async ({
      groupByOptionId,
      show = false,
      properties = {},
      insertLast = true,
      isTemplate = false
    }: {
      groupByOptionId?: string;
      show?: boolean;
      properties?: Record<string, string>;
      insertLast?: boolean;
      isTemplate?: boolean;
    }) => {
      if (!activeBoard) {
        throw new Error('No active board');
      }
      if (!activeView) {
        throw new Error('No active view');
      }

      const card = createCard();

      card.parentId = activeBoard.id;
      card.rootId = activeBoard.rootId;
      const propertiesThatMeetFilters = CardFilter.propertiesThatMeetFilterGroup(
        activeView.fields.filter,
        activeBoard.fields.cardProperties
      );

      if ((activeView.fields.viewType === 'board' || activeView.fields.viewType === 'table') && groupByProperty) {
        if (groupByOptionId) {
          propertiesThatMeetFilters[groupByProperty.id] = groupByOptionId;
        } else {
          delete propertiesThatMeetFilters[groupByProperty.id];
        }
      }
      card.fields.properties = { ...card.fields.properties, ...properties, ...propertiesThatMeetFilters };

      card.fields.contentOrder = [];
      card.fields.isTemplate = isTemplate;

      mutator.performAsUndoGroup(async () => {
        const newCardOrder = insertLast
          ? [...activeView.fields.cardOrder, card.id]
          : [card.id, ...activeView.fields.cardOrder];

        // update view order first so that when we add the block it appears in the right spot
        await mutator.changeViewCardOrder(activeView, newCardOrder, 'add-card');

        await mutator.insertBlock(
          card,
          'add card',
          async (block: UIBlockWithDetails) => {
            if (isTemplate) {
              showCard(block.id, true);
            } else if (show) {
              __addCard(createCard(block));
              _updateView({ ...activeView, fields: { ...activeView.fields, cardOrder: newCardOrder } });
              showCard(block.id);
            } else {
              // Focus on this card's title inline on next render
              setState((_state) => ({ ..._state, cardIdToFocusOnRender: card.id }));
              setTimeout(() => setState((_state) => ({ ..._state, cardIdToFocusOnRender: '' })), 100);
            }
          },
          async () => {
            showCard(null);
          }
        );
      });
    },
    [activeBoard, activeView, __addCard, setState, space, groupByProperty, _updateView, showCard]
  );

  const cardClicked = useCallback(
    (e: React.MouseEvent, card: Card): void => {
      if (!activeView) {
        return;
      }

      if (e.shiftKey) {
        let selectedCardIds = state.selectedCardIds.slice();
        if (selectedCardIds.length > 0 && (e.metaKey || e.ctrlKey)) {
          // Cmd+Shift+Click: Extend the selection
          const orderedCardIds = sortedCards.map((o) => o.id);
          const lastCardId = selectedCardIds[selectedCardIds.length - 1];
          const srcIndex = orderedCardIds.indexOf(lastCardId);
          const destIndex = orderedCardIds.indexOf(card.id);
          const newCardIds =
            srcIndex < destIndex
              ? orderedCardIds.slice(srcIndex, destIndex + 1)
              : orderedCardIds.slice(destIndex, srcIndex + 1);
          for (const newCardId of newCardIds) {
            if (!selectedCardIds.includes(newCardId)) {
              selectedCardIds.push(newCardId);
            }
          }
          setState({ ...state, selectedCardIds });
        } else {
          // Shift+Click: add to selection
          if (selectedCardIds.includes(card.id)) {
            selectedCardIds = selectedCardIds.filter((o) => o !== card.id);
          } else {
            selectedCardIds.push(card.id);
          }
          setState({ ...state, selectedCardIds });
        }
      } else if (activeView.fields.viewType === 'board' || activeView.fields.viewType === 'gallery') {
        showCard(card.id);
      }

      if (activeView?.fields.viewType !== 'table') {
        e.stopPropagation();
      }
    },
    [activeView]
  );

  const calendarAddCard = useCallback(
    (properties: Record<string, string>) => {
      addCard({
        groupByOptionId: '',
        show: true,
        properties
      });
    },
    [addCard]
  );

  const viewHeaderAddCard = useCallback(() => {
    addCard({
      groupByOptionId: '',
      show: true
    });
  }, [addCard]);

  const viewHeaderAddCardTemplate = useCallback(() => {
    addCard({
      groupByOptionId: '',
      show: true,
      isTemplate: true,
      insertLast: false,
      properties: {}
    });
  }, [addCard]);

  const kanbanAddCard = useCallback(
    (groupByOptionId?: string) => {
      addCard({
        groupByOptionId,
        show: true
      });
    },
    [addCard]
  );

  const galleryAddCard = useCallback(
    (show: boolean) => {
      addCard({
        groupByOptionId: '',
        show
      });
    },
    [addCard]
  );

  async function deleteSelectedCards() {
    const { selectedCardIds } = state;
    if (selectedCardIds.length < 1) {
      return;
    }

    mutator.performAsUndoGroup(async () => {
      for (const cardId of selectedCardIds) {
        const card = sortedCards.find((o) => o.id === cardId);
        if (card) {
          mutator.deleteBlock(
            card,
            selectedCardIds.length > 1 ? `delete ${selectedCardIds.length} cards` : 'delete card'
          );
        } else {
          Utils.assertFailure(`Selected card not found: ${cardId}`);
        }
      }
    });

    setState({ ...state, selectedCardIds: [] });
  }

  function addNewLinkedView() {
    // delay the sidebar opening so that we dont trigger it to close right away
    setTimeout(() => {
      setState({ ...state, openSettings: 'create-linked-view' });
    });
  }

  function toggleViewOptions(enable?: boolean) {
    enable = enable ?? state.openSettings !== 'view-options';
    const openSettings = enable ? 'view-options' : null;
    // delay the sidebar opening so that we dont trigger it to close right away
    setTimeout(() => {
      setState({ ...state, openSettings });
    });
  }

  function closeSettings() {
    setState({ ...state, openSettings: null });
  }

  // close settings once a view has been added
  useEffect(() => {
    setCheckedIds([]);
    if (activeView) {
      closeSettings();
    }
  }, [activeView?.id]);

  useEffect(() => {
    const viewType = activeView?.fields.viewType;
    if (viewType !== 'table') {
      setCheckedIds([]);
    }
  }, [activeView?.fields.viewType]);

  // refresh google forms data whenever source changes
  useEffect(() => {
    if (activeView) {
      if (activeView.fields.sourceType === 'google_form') {
        setLoadingFormResponses(true);
        charmClient.google.forms.syncFormResponses({ viewId: activeView.id }).finally(() => {
          setLoadingFormResponses(false);
        });
      }
    }
  }, [`${activeView?.fields.sourceData?.formId}${activeView?.fields.sourceData?.boardId}`]);

  // useEffect(() => {
  //   if (currentRootPageId && activeBoard?.fields.sourceType === 'proposals' && activeBoard?.id === currentRootPageId) {
  //     updateProposalSource({ pageId: currentRootPageId }).then(() => {
  //       // Refetch database after updating proposal source board, otherwise the UI will be out of sync
  //       dispatch(initialDatabaseLoad({ pageId: currentRootPageId }));
  //     });
  //   }
  // }, [currentRootPageId, activeBoard?.id]);

  const isLoadingSourceData = !activeBoard && (!views || views.length === 0);
  const readOnlyTitle = activeBoard?.fields.sourceType === 'proposals';

  const boardSourceType = activeView?.fields.sourceType ?? activeBoard?.fields.sourceType;

  const disableAddingNewCards = boardSourceType === 'proposals';
  const noBoardViewsYet = !isLoadingSourceData && views.length === 0;
  const showNewLinkedBoardView = state.openSettings === 'create-linked-view' || noBoardViewsYet;

  return (
    <>
      {!!boardPage?.deletedAt && <PageDeleteBanner pageType={boardPage.type} pageId={boardPage.id} />}
      {keys?.map((key) =>
        activeBoardId === key.pageId ? (
          <PageWebhookBanner
            key={key.apiKey}
            type={key.type}
            url={`${window.location.origin}/${webhookEndpoint}/${key?.apiKey}`}
            sx={{
              ...(isEmbedded && {
                border: (theme) => `2px solid ${theme.palette.text.primary}`,
                backgroundColor: 'transparent !important'
              })
            }}
          />
        ) : null
      )}
      <div
        data-test={`database-container-${props.board.id}`}
        // remount components between pages
        className={`BoardComponent drag-area-container ${isEmbedded ? 'embedded-board' : ''}`}
        ref={backgroundRef}
        onClick={(e) => {
          backgroundClicked(e);
        }}
      >
        <Hotkeys keyName='ctrl+d,del,esc,backspace' onKeyDown={keydownHandler} />
        {!props.hideBanner && board.fields.headerImage && (
          <Box className='PageBanner' width='100%' mb={2}>
            <PageBanner
              focalBoard
              headerImage={board.fields.headerImage}
              readOnly={props.readOnly}
              setPage={({ headerImage }) => setRandomHeaderImage(board, headerImage)}
            />
          </Box>
        )}
        <div className='top-head'>
          {board && boardPage && (boardPageType === 'board' || !isEmbedded) && (
            <ViewTitle
              key={boardPage.id + boardPage.title}
              board={board}
              pageTitle={boardPage.title}
              pageIcon={pageIcon}
              readOnly={props.readOnly}
              setPage={props.setPage}
            />
          )}
          {(activePage || activeBoard) && (
            <ViewHeader
              onDeleteView={props.onDeleteView}
              maxTabsShown={props.maxTabsShown}
              disableUpdatingUrl={props.disableUpdatingUrl}
              showView={props.showView}
              onClickNewView={activeView?.fields?.linkedSourceId ? addNewLinkedView : undefined}
              activeBoard={activeBoard}
              viewsBoard={board}
              activeView={props.activeView}
              toggleViewOptions={toggleViewOptions}
              cards={sortedCards}
              views={views}
              dateDisplayProperty={dateDisplayProperty}
              addCard={viewHeaderAddCard}
              showCard={showCard}
              // addCardFromTemplate={addCardFromTemplate}
              addCardTemplate={viewHeaderAddCardTemplate}
              readOnly={props.readOnly}
              embeddedBoardPath={props.embeddedBoardPath}
              checkedIds={checkedIds}
              setCheckedIds={setCheckedIds}
            />
          )}
        </div>

        <div className={`container-container ${state.openSettings ? 'sidebar-visible' : ''}`}>
          <Box display='flex' minHeight={state.openSettings ? 450 : 0}>
            {showNewLinkedBoardView && (
              <Box width='100%'>
                <CreateLinkedView rootBoard={board} views={views} showView={showView} />
              </Box>
            )}
            {!showNewLinkedBoardView && (
              <Box width='100%'>
                {/* Show page title for inline boards */}
                {activeBoard && activePage && isEmbedded && boardPageType === 'inline_board' && (
                  <InlineViewTitle
                    key={activePage.id + activePage.title}
                    pageTitle={activePage.title || ''}
                    readOnly={props.readOnly}
                    setPage={props.setPage}
                  />
                )}
                {activeBoard && activeView?.fields.sourceType === 'google_form' && (
                  <Typography fontSize={22} fontWeight={500}>
                    Form responses to{' '}
                    <Link
                      target='_blank'
                      href={`${activeView?.fields.sourceData?.formUrl}/edit#responses`}
                      sx={{ color: 'inherit', fontWeight: 700 }}
                    >
                      {activeView?.fields.sourceData?.formName || 'Untitled'}
                      <LaunchIcon fontSize='small' sx={{ ml: 0.5, position: 'relative', top: 3 }} />
                    </Link>
                    {loadingFormResponses && (
                      <Box ml={2} component='span'>
                        <CircularProgress style={{ color: '#ccc', height: 14, width: 14 }} />
                      </Box>
                    )}
                  </Typography>
                )}
                {/* Show page title for linked boards */}
                {activePage && activeView?.fields?.linkedSourceId && boardPageType === 'inline_linked_board' && (
                  <Button
                    color='secondary'
                    startIcon={<CallMadeIcon />}
                    variant='text'
                    size='large'
                    href={`${router.pathname.startsWith('/share') ? '/share' : ''}/${space?.domain}/${
                      activePage?.path
                    }`}
                    sx={{ fontSize: 22, fontWeight: 700, py: 0 }}
                  >
                    {activePage?.title || 'Untitled'}
                  </Button>
                )}
                {activeBoard && activeView?.fields.viewType === 'board' && (
                  <Kanban
                    board={activeBoard}
                    activeView={activeView}
                    cards={sortedCards}
                    groupByProperty={groupByProperty}
                    visibleGroups={visibleGroups}
                    hiddenGroups={hiddenGroups}
                    selectedCardIds={state.selectedCardIds}
                    readOnly={props.readOnly}
                    onCardClicked={cardClicked}
                    addCard={kanbanAddCard}
                    showCard={showCard}
                    disableAddingCards={disableAddingNewCards}
                    readOnlyTitle={readOnlyTitle}
                  />
                )}
                {activeBoard && activeView?.fields.viewType === 'table' && (
                  <Table
                    setSelectedPropertyId={setSelectedPropertyId}
                    board={activeBoard}
                    activeView={activeView}
                    cards={sortedCards}
                    groupByProperty={groupByProperty}
                    views={views}
                    visibleGroups={visibleGroups}
                    selectedCardIds={state.selectedCardIds}
                    readOnly={props.readOnly}
                    cardIdToFocusOnRender={state.cardIdToFocusOnRender}
                    showCard={(cardId, e) => showCard(cardId, undefined, e)}
                    addCard={kanbanAddCard}
                    onCardClicked={cardClicked}
                    disableAddingCards={disableAddingNewCards}
                    readOnlyTitle={readOnlyTitle}
                    checkedIds={checkedIds}
                    setCheckedIds={setCheckedIds}
                  />
                )}
                {activeBoard && activeView?.fields.viewType === 'calendar' && (
                  <CalendarFullView
                    board={activeBoard}
                    cards={sortedCards}
                    activeView={activeView}
                    readOnly={props.readOnly}
                    dateDisplayProperty={dateDisplayProperty}
                    showCard={showCard}
                    addCard={calendarAddCard}
                    disableAddingCards={disableAddingNewCards}
                  />
                )}
                {activeBoard && activeView?.fields.viewType === 'gallery' && (
                  <Gallery
                    board={activeBoard}
                    cards={sortedCards}
                    activeView={activeView}
                    readOnly={props.readOnly}
                    onCardClicked={cardClicked}
                    selectedCardIds={state.selectedCardIds}
                    addCard={galleryAddCard}
                    disableAddingCards={disableAddingNewCards}
                  />
                )}
                {isLoadingSourceData && <LoadingComponent isLoading={true} height={400} />}
              </Box>
            )}

            <ViewSidebar
              selectedPropertyId={selectedPropertyId}
              sidebarView={selectedPropertyId ? 'card-property' : undefined}
              setSelectedPropertyId={(_selectedPropertyId) => {
                setSelectedPropertyId(_selectedPropertyId);
              }}
              cards={sortedCards}
              views={views}
              page={props.page}
              board={activeBoard}
              pageId={activePage?.id}
              rootBoard={board}
              view={activeView}
              isOpen={state.openSettings === 'view-options'}
              closeSidebar={closeSettings}
              groupByProperty={groupByProperty}
              showView={showView}
            />
          </Box>
        </div>
      </div>
    </>
  );
}

export function groupCardsByOptions(
  cards: Card[],
  optionIds: string[],
  groupByProperty?: IPropertyTemplate
): BoardGroup[] {
  const groups: BoardGroup[] = [];

  // TODO: allow other type of properties besides select/multiSelect and proposalUrl
  // Note: when adding a new field here, make sure it can be updated or editing is disabled in the onSave handler inside tableGroupHeaderRow.tsx
  if (groupByProperty?.type === 'proposalUrl') {
    // group cards based on the value of the proposalUrl property
    const valueMap: Record<string, Card[]> = {};
    for (const card of cards) {
      const cardValue = card.fields.properties[groupByProperty.id];
      const proposalTitle = typeof cardValue === 'string' ? cardValue : Array.isArray(cardValue) ? cardValue[1] : null;
      if (typeof proposalTitle === 'string') {
        if (!valueMap[proposalTitle]) {
          valueMap[proposalTitle] = [];
        }
        valueMap[proposalTitle].push(card);
      }
    }

    for (const [value, valueCards] of Object.entries(valueMap)) {
      const group: BoardGroup = {
        id: value || '',
        // option: { id: 'proposalUrl', value: value || `No ${groupByProperty?.name}`, color: '' },
        value: value || '',
        cards: valueCards
      };
      groups.push(group);
    }
  } else {
    for (const optionId of optionIds) {
      if (optionId) {
        const option = (groupByProperty?.options ?? []).find((o) => o.id === optionId);
        if (groupByProperty && option) {
          const filteredCards = cards.filter((o) => optionId === o.fields.properties[groupByProperty.id]);
          const group: BoardGroup = {
            id: option.id,
            option,
            cards: filteredCards
          };
          groups.push(group);
        }
      } else {
        // Empty group
        const emptyGroupCards = cards.filter((card) => {
          const groupByOptionId = card.fields.properties[groupByProperty?.id || ''];
          return !groupByOptionId || !(groupByProperty?.options ?? []).find((option) => option.id === groupByOptionId);
        });
        const group: BoardGroup = {
          id: '',
          option: { id: '', value: `No ${groupByProperty?.name}`, color: '' },
          cards: emptyGroupCards
        };
        groups.push(group);
      }
    }
  }
  return groups;
}

export function getVisibleAndHiddenGroups(
  cards: Card[],
  visibleOptionIds: string[],
  hiddenOptionIds: string[],
  groupByProperty?: IPropertyTemplate
): { visible: BoardGroup[]; hidden: BoardGroup[] } {
  let unassignedOptionIds: string[] = [];
  if (groupByProperty) {
    unassignedOptionIds = (groupByProperty.options ?? [])
      .filter((o: IPropertyOption) => !visibleOptionIds.includes(o.id) && !hiddenOptionIds.includes(o.id))
      .map((o: IPropertyOption) => o.id);
  }
  const allVisibleOptionIds = [...visibleOptionIds, ...unassignedOptionIds];
  // If the empty group position is not explicitly specified, make it the first visible column
  if (!allVisibleOptionIds.includes('') && !hiddenOptionIds.includes('')) {
    allVisibleOptionIds.unshift('');
  }

  const _visibleGroups = groupCardsByOptions(cards, allVisibleOptionIds, groupByProperty);
  const _hiddenGroups = groupCardsByOptions(cards, hiddenOptionIds, groupByProperty);
  return { visible: _visibleGroups, hidden: _hiddenGroups };
}

const connector = connect(undefined, { addCard: _addCard, addTemplate, updateView });

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(injectIntl(CenterPanel));
