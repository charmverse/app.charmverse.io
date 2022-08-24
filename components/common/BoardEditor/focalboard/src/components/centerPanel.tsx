// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import { Box } from '@mui/system';
import PageBanner, { randomBannerImage } from 'components/[pageId]/DocumentPage/components/PageBanner';
import PageDeleteBanner from 'components/[pageId]/DocumentPage/components/PageDeleteBanner';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { Page } from '@prisma/client';
import React, { ReactNode, useState } from 'react';
import Hotkeys from 'react-hot-keys';
import { mutate } from 'swr';
import { injectIntl, IntlShape } from 'react-intl';
import { connect } from 'react-redux';
import charmClient from 'charmClient';
import { BlockIcons } from '../blockIcons';
import { Block } from '../blocks/block';
import { Board, BoardGroup, IPropertyOption, IPropertyTemplate } from '../blocks/board';
import { BoardView } from '../blocks/boardView';
import { Card, createCard } from '../blocks/card';
import { CardFilter } from '../cardFilter';
import { ClientConfig } from '../config/clientConfig';
import mutator from '../mutator';
import { addCard, addTemplate } from '../store/cards';
import { updateView } from '../store/views';
import { UserSettings } from '../userSettings';
import { Utils } from '../utils';
import Gallery from './gallery/gallery';
import Kanban from './kanban/kanban';
import Table from './table/table';
import ViewHeader from './viewHeader/viewHeader';
import ViewTitle from './viewTitle';
import dynamic from 'next/dynamic';

const CalendarFullView = dynamic(() => import('./calendar/fullCalendar'), { ssr: false });

type Props = {
  clientConfig?: ClientConfig
  board: Board
  cards: Card[]
  activeView: BoardView
  views: BoardView[]
  groupByProperty?: IPropertyTemplate
  showHeader?: boolean
  showTitle?: boolean
  dateDisplayProperty?: IPropertyTemplate
  hideViewTabs?: boolean
  hideBanner?: boolean
  intl: IntlShape
  readonly: boolean
  addCard: (card: Card) => void
  setPage: (p: Partial<Page>) => void
  updateView: (view: BoardView) => void
  addTemplate: (template: Card) => void
  showCard: (cardId?: string) => void
  // A custom menu component to allow adding new view
  addViewMenu?: ReactNode
  onViewTabClick?: (viewId: string) => void
  disableUpdatingUrl?: boolean
  maxTabsShown?: number
  onDeleteView?: (viewId: string) => void
}

type State = {
  selectedCardIds: string[]
  cardIdToFocusOnRender: string
}

function CenterPanel (props: Props) {
  const [state, setState] = useState<State>({
    cardIdToFocusOnRender: '',
    selectedCardIds: []
  });

  const [space] = useCurrentSpace();

  const backgroundRef = React.createRef<HTMLDivElement>();
  const keydownHandler = (keyName: string, e: KeyboardEvent) => {
    if (e.target !== document.body || props.readonly) {
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

  function setRandomHeaderImage (board: Board, headerImage?: string | null) {
    const newHeaderImage = headerImage ?? randomBannerImage();
    // Null is passed if we want to remove the image
    mutator.changeHeaderImage(board.id, board.fields.headerImage, headerImage !== null ? newHeaderImage : null);
  }

  function backgroundClicked (e: React.MouseEvent) {
    if (state.selectedCardIds.length > 0) {
      setState({ ...state, selectedCardIds: [] });
      e.stopPropagation();
    }
  }

  // const addCardFromTemplate = async (cardTemplateId: string) => {
  //   const { activeView, board } = props

  //   mutator.performAsUndoGroup(async () => {
  //     if (pages[cardTemplateId]) {
  //       const [, newCardId] = await mutator.duplicateCard({
  //         cardId: cardTemplateId,
  //         board,
  //         description: props.intl.formatMessage({ id: 'Mutator.new-card-from-template', defaultMessage: 'new card from template' }),
  //         asTemplate: false,
  //         afterRedo: async (cardId) => {
  //           props.updateView({ ...activeView, fields: { ...activeView.fields, cardOrder: [...activeView.fields.cardOrder, cardId] } })
  //           // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateCardViaTemplate, {board: props.board.id, view: props.activeView.id, card: cardId, cardTemplateId})
  //           showCard(cardId)
  //         },
  //         beforeUndo: async () => {
  //           showCard(undefined)
  //         },
  //         cardPage: pages[cardTemplateId]!
  //       }
  //       )
  //       await mutator.changeViewCardOrder(activeView, [...activeView.fields.cardOrder, newCardId], 'add-card')
  //     }
  //   })
  // }

  const addCard = async (groupByOptionId?: string, show = false, properties: Record<string, string> = {}, insertLast = true): Promise<void> => {
    const { activeView, board, groupByProperty } = props;

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

    mutator.performAsUndoGroup(async () => {
      const newCardOrder = insertLast ? [...activeView.fields.cardOrder, card.id] : [card.id, ...activeView.fields.cardOrder];
      // update view order first so that when we add the block it appears in the right spot
      await mutator.changeViewCardOrder(activeView, newCardOrder, 'add-card');

      await mutator.insertBlock(
        card,
        'add card',
        async (block: Block) => {
          if (space) {
            await mutate(`pages/${space.id}`, async (pages: Page[]): Promise<Page[]> => {
              const newPage = await charmClient.getPage(block.id);
              return [...pages, newPage];
            }, {
              revalidate: false
            });
          }
          if (show) {
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
          showCard(undefined);
        }
      );
    });
  };

  const addCardTemplate = async () => {
    const { board, activeView } = props;

    const cardTemplate = createCard();
    cardTemplate.fields.isTemplate = true;
    cardTemplate.parentId = board.id;
    cardTemplate.rootId = board.rootId;

    await mutator.insertBlock(
      cardTemplate,
      'add card template',
      async (newBlock: Block) => {
        const newTemplate = createCard(newBlock);
        // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateCardTemplate, {board: board.id, view: activeView.id, card: newTemplate.id})
        props.addTemplate(newTemplate);
        showCard(newTemplate.id);
      },
      async () => {
        showCard(undefined);
      }
    );
  };

  const editCardTemplate = (cardTemplateId: string) => {
    showCard(cardTemplateId);
  };

  const cardClicked = (e: React.MouseEvent, card: Card): void => {
    const { activeView, cards } = props;

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

  const showCard = React.useCallback((cardId?: string) => {
    if (state.selectedCardIds.length > 0) {
      setState({ ...state, selectedCardIds: [] });
    }
    props.showCard(cardId);
  }, [props.showCard, state.selectedCardIds]);

  async function deleteSelectedCards () {
    const { selectedCardIds } = state;
    if (selectedCardIds.length < 1) {
      return;
    }

    mutator.performAsUndoGroup(async () => {
      for (const cardId of selectedCardIds) {
        const card = props.cards.find((o) => o.id === cardId);
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

  function groupCardsByOptions (cards: Card[], optionIds: string[], groupByProperty?: IPropertyTemplate): BoardGroup[] {
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

  function getVisibleAndHiddenGroups (cards: Card[], visibleOptionIds: string[], hiddenOptionIds: string[], groupByProperty?: IPropertyTemplate): { visible: BoardGroup[], hidden: BoardGroup[] } {
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

    const visibleGroups = groupCardsByOptions(cards, allVisibleOptionIds, groupByProperty);
    const hiddenGroups = groupCardsByOptions(cards, hiddenOptionIds, groupByProperty);
    return { visible: visibleGroups, hidden: hiddenGroups };
  }

  const { groupByProperty, activeView, board, views, cards } = props;
  const { visible: visibleGroups, hidden: hiddenGroups } = getVisibleAndHiddenGroups(cards, activeView.fields.visibleOptionIds, activeView.fields.hiddenOptionIds, groupByProperty);

  return (
    <div
      className='BoardComponent'
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
      {props.showHeader && !props.hideBanner &&  board.fields.headerImage && (
        <Box className='PageBanner' width='100%' mb={2}>
          <PageBanner
            focalBoard
            headerImage={board.fields.headerImage}
            readOnly={props.readonly}
            setPage={({ headerImage }) => setRandomHeaderImage(board, headerImage!)}
          />
        </Box>
      )}
      {props.showHeader && (
        <div className='top-head'>
          {props.showTitle && <ViewTitle
            key={board.id + board.title}
            board={board}
            readonly={props.readonly}
            setPage={props.setPage}
            />}
          <ViewHeader
            onDeleteView={props.onDeleteView}
            maxTabsShown={props.maxTabsShown}
            disableUpdatingUrl={props.disableUpdatingUrl}
            onViewTabClick={props.onViewTabClick}
            addViewMenu={props.addViewMenu}
            hideViewTabs={props.hideViewTabs}
            board={props.board}
            activeView={props.activeView}
            cards={props.cards}
            views={props.views}
            groupByProperty={props.groupByProperty}
            dateDisplayProperty={props.dateDisplayProperty}
            addCard={() => addCard('', true)}
            // addCardFromTemplate={addCardFromTemplate}
            addCardTemplate={addCardTemplate}
            editCardTemplate={editCardTemplate}
            readonly={props.readonly}
          />
        </div>
      )}

      <div className='container-container'>
        {activeView.fields.viewType === 'board'
          && (
          <Kanban
            board={props.board}
            activeView={props.activeView}
            cards={props.cards}
            groupByProperty={props.groupByProperty}
            visibleGroups={visibleGroups}
            hiddenGroups={hiddenGroups}
            selectedCardIds={state.selectedCardIds}
            readonly={props.readonly}
            onCardClicked={cardClicked}
            addCard={addCard}
            showCard={showCard}
          />
          )}
        {activeView.fields.viewType === 'table'
          && (
          <Table
            board={props.board}
            activeView={props.activeView}
            cards={props.cards}
            groupByProperty={props.groupByProperty}
            views={props.views}
            visibleGroups={visibleGroups}
            selectedCardIds={state.selectedCardIds}
            readonly={props.readonly}
            cardIdToFocusOnRender={state.cardIdToFocusOnRender}
            showCard={showCard}
            addCard={addCard}
            onCardClicked={cardClicked}
          />
          )}
        {activeView.fields.viewType === 'calendar'
          && (
          <CalendarFullView
            board={props.board}
            cards={props.cards}
            activeView={props.activeView}
            readonly={props.readonly}
            dateDisplayProperty={props.dateDisplayProperty}
            showCard={showCard}
            addCard={(properties: Record<string, string>) => {
              addCard('', true, properties);
            }}
          />
          )}

        {activeView.fields.viewType === 'gallery'
          && (
          <Gallery
            board={props.board}
            cards={props.cards}
            activeView={props.activeView}
            readonly={props.readonly}
            onCardClicked={cardClicked}
            selectedCardIds={state.selectedCardIds}
            addCard={(show) => addCard('', show)}
          />
          )}
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

export default connect(undefined, { addCard, addTemplate, updateView })(injectIntl(CenterPanel));
