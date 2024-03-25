import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { getChainList } from 'connectors/chains';

import type { Board } from 'lib/databases/board';
import type { BoardView, ISortOption } from 'lib/databases/boardView';
import type { Card, CardPage } from 'lib/databases/card';
import { CardFilter } from 'lib/databases/cardFilter';
import { Constants } from 'lib/databases/constants';
import type { FilterGroup } from 'lib/databases/filterGroup';
import type { Member } from 'lib/members/interfaces';
import { PROPOSAL_REVIEWERS_BLOCK_ID } from 'lib/proposals/blocks/constants';

import type { PageListItemsRecord } from '../interfaces';
import { Utils } from '../utils';

import { blockLoad, initialDatabaseLoad } from './databaseBlocksLoad';

import type { RootState } from './index';

const allChains = getChainList({ enableTestnets: true });

type CardsState = {
  current: string;
  cards: { [key: string]: Card };
  templates: { [key: string]: Card };
};

function updateCardTitleProperty({ card, cards }: { cards: CardsState['cards']; card: Card }) {
  const cardTitle = card.title || cards[card.id]?.title;
  const cardAfterUpdate = Object.assign(cards[card.id] || {}, card);
  cardAfterUpdate.title = cardTitle;
  cards[card.id] = cardAfterUpdate;
  if (cardAfterUpdate.fields && cardAfterUpdate.fields.properties) {
    cardAfterUpdate.fields.properties[Constants.titleColumnId] = cardAfterUpdate.title || '';
  }
}

const cardsSlice = createSlice({
  name: 'cards',
  initialState: {
    current: '',
    cards: {},
    templates: {}
  } as CardsState,
  reducers: {
    setCurrent: (state, action: PayloadAction<string>) => {
      state.current = action.payload;
    },
    addCard: (state, action: PayloadAction<Card>) => {
      updateCardTitleProperty({
        card: action.payload,
        cards: state.cards
      });
    },
    addTemplate: (state, action: PayloadAction<Card>) => {
      state.templates[action.payload.id] = action.payload;
    },
    updateCards: (state, action: PayloadAction<(Partial<Card> & { id: string })[]>) => {
      for (const card of action.payload) {
        if (card.deletedAt) {
          delete state.cards[card.id];
          delete state.templates[card.id];
        } else if (card.fields?.isTemplate) {
          const cardAfterUpdate = Object.assign(state.templates[card.id] || {}, card);
          state.templates[card.id] = cardAfterUpdate;
        } else {
          updateCardTitleProperty({
            card: card as Card,
            cards: state.cards
          });
        }
      }
    },
    deleteCards: (state, action: PayloadAction<Pick<Card, 'id'>[]>) => {
      action.payload.forEach((deletedCard) => {
        delete state.cards[deletedCard.id];
        delete state.templates[deletedCard.id];
      });
    }
  },
  extraReducers: (builder) => {
    builder.addCase(blockLoad.fulfilled, (state, action) => {
      state.cards = state.cards ?? {};
      const block = action.payload;
      if (block.type === 'card') {
        updateCardTitleProperty({
          card: block as Card,
          cards: state.cards
        });
      }
    });

    builder.addCase(initialDatabaseLoad.fulfilled, (state, action) => {
      for (const block of action.payload) {
        if (block.type === 'card' && block.fields.isTemplate) {
          state.templates[block.id] = block as Card;
        } else if (block.type === 'card' && !block.fields.isTemplate) {
          updateCardTitleProperty({
            card: block as Card,
            cards: state.cards
          });
        }
      }
    });
  }
});

export const { updateCards, addCard, addTemplate, setCurrent, deleteCards } = cardsSlice.actions;
export const { reducer } = cardsSlice;

export const getCards = (state: RootState): { [key: string]: Card } => state.cards.cards;

export const getSortedCards = createSelector(getCards, (cards) => {
  return Object.values(cards).sort((a, b) => a.title.localeCompare(b.title)) as Card[];
});

export const getTemplates = (state: RootState): { [key: string]: Card } => state.cards.templates;

export function getCard(cardId: string): (state: RootState) => Card | undefined {
  return (state: RootState): Card | undefined => {
    return state.cards.cards[cardId] || state.cards.templates[cardId];
  };
}

function titleOrCreatedOrder(
  cardA: { card: { createdAt: number }; page: { title: string } },
  cardB: { card: { createdAt: number }; page: { title: string } }
) {
  const aValue = cardA.page.title;
  const bValue = cardB.page.title;

  if (aValue && bValue && aValue.localeCompare) {
    return aValue.localeCompare(bValue);
  }

  // Always put untitled cards at the bottom
  if (aValue && !bValue) {
    return -1;
  }
  if (bValue && !aValue) {
    return 1;
  }

  // If both cards are untitled, use the create date
  return new Date(cardA.card.createdAt).getTime() - new Date(cardB.card.createdAt).getTime();
}

function manualOrder(activeView: BoardView, cardA: CardPage, cardB: CardPage) {
  const indexA = activeView.fields.cardOrder.indexOf(cardA.card.id);
  const indexB = activeView.fields.cardOrder.indexOf(cardB.card.id);

  if (indexA < 0 && indexB < 0) {
    return titleOrCreatedOrder(cardA, cardB);
  } else if (indexA < 0 && indexB >= 0) {
    // If cardA's order is not defined, put it at the end
    return 1;
  }
  return indexA - indexB;
}

export function sortCards(
  cardPages: CardPage[],
  board: Pick<Board, 'fields'>,
  activeView: BoardView,
  members: Record<string, Member>,
  relationPropertiesCardsRecord: PageListItemsRecord,
  localSort?: ISortOption[] | null
): CardPage[] {
  if (!activeView) {
    return cardPages;
  }

  const { sortOptions: globalSortOptions } = activeView.fields;
  const sortOptions = localSort || globalSortOptions;

  if (sortOptions?.length < 1) {
    return cardPages.sort((a, b) => manualOrder(activeView, a, b));
  }

  let sortedCards = cardPages;
  for (const sortOption of sortOptions) {
    if (sortOption.propertyId === Constants.titleColumnId) {
      Utils.log('Sort by title');
      sortedCards = sortedCards.sort((a, b) => {
        const result = titleOrCreatedOrder(a, b);
        return sortOption.reversed ? -result : result;
      });
    } else {
      const sortPropertyId = sortOption.propertyId;
      const template = board.fields.cardProperties.find((o) => o.id === sortPropertyId);
      if (!template) {
        Utils.logError(`Missing template for property id: ${sortPropertyId}`);
        return sortedCards;
      }
      sortedCards = sortedCards.sort((a, b) => {
        let aValue = a.card.fields.properties[sortPropertyId] || '';
        let bValue = b.card.fields.properties[sortPropertyId] || '';

        if (template.type === 'createdBy') {
          aValue = members[a.card.createdBy]?.username || '';
          bValue = members[b.card.createdBy]?.username || '';
        } else if (template.type === 'updatedBy') {
          aValue = members[a.page.updatedBy]?.username || '';
          bValue = members[b.page.updatedBy]?.username || '';
        } else if (template.type === 'date') {
          if (typeof aValue !== 'number') {
            aValue = aValue === '' ? '' : JSON.parse(aValue as string).from;
          }

          if (typeof bValue !== 'number') {
            bValue = bValue === '' ? '' : JSON.parse(bValue as string).from;
          }
        } else if (template.type === 'relation') {
          const pageListItems = relationPropertiesCardsRecord[template.id] ?? [];
          const aPageListItems = Array.isArray(aValue)
            ? aValue.map((pageId) => pageListItems.find((pageListItem) => pageListItem.id === pageId)?.title)
            : [];
          const bPageListItems = Array.isArray(bValue)
            ? bValue.map((pageId) => pageListItems.find((pageListItem) => pageListItem.id === pageId)?.title)
            : [];
          aValue = aPageListItems.join(', ');
          bValue = bPageListItems.join(', ');
        }

        let result = 0;
        if (
          template.type === 'number' ||
          template.type === 'date' ||
          template.type === 'tokenAmount' ||
          template.type === 'proposalEvaluationAverage' ||
          template.type === 'proposalEvaluationTotal'
        ) {
          // Always put empty values at the bottom
          if (aValue && !bValue) {
            return -1;
          }
          if (bValue && !aValue) {
            return 1;
          }
          if (!aValue && !bValue) {
            result = titleOrCreatedOrder(a, b);
          } else {
            result = Number(aValue) - Number(bValue);
          }
        } else if (template.type === 'createdTime') {
          result = a.card.createdAt - b.card.createdAt;
        } else if (template.type === 'updatedTime') {
          result = a.card.updatedAt - b.card.updatedAt;
        } else if (template.type === 'checkbox') {
          // aValue will be true or empty string
          if (aValue) {
            result = 1;
          } else if (bValue) {
            result = -1;
          } else {
            result = titleOrCreatedOrder(a, b);
          }
        } else if (template.id === PROPOSAL_REVIEWERS_BLOCK_ID) {
          const value1 = (Array.isArray(aValue) ? aValue[0] : aValue) as unknown as Record<string, any>;
          const value2 = (Array.isArray(bValue) ? bValue[0] : bValue) as unknown as Record<string, any>;
          aValue = typeof value1 === 'object' && 'id' in value1 ? members[value1.id]?.username || '' : '';
          bValue = typeof value2 === 'object' && 'id' in value2 ? members[value2.id]?.username || '' : '';
          result = aValue.localeCompare(bValue);
        } else {
          // Text-based sort

          if (typeof aValue === 'number' || typeof bValue === 'number') {
            return a > b ? -1 : 1;
          }

          if (aValue.length > 0 && bValue.length <= 0) {
            return -1;
          }
          if (bValue.length > 0 && aValue.length <= 0) {
            return 1;
          }
          if (aValue.length <= 0 && bValue.length <= 0) {
            result = titleOrCreatedOrder(a, b);
          }

          if (template.type === 'select' || template.type === 'multiSelect') {
            aValue = template.options.find((o) => o.id === (Array.isArray(aValue) ? aValue[0] : aValue))?.value || '';
            bValue = template.options.find((o) => o.id === (Array.isArray(bValue) ? bValue[0] : bValue))?.value || '';
          }

          if (template.type === 'tokenChain') {
            aValue =
              allChains.find((o) => o.chainId.toString() === (Array.isArray(aValue) ? aValue[0] : aValue))?.chainName ||
              '';
            bValue =
              allChains.find((o) => o.chainId.toString() === (Array.isArray(bValue) ? bValue[0] : bValue))?.chainName ||
              '';
          }

          if (result === 0) {
            const aValueString = aValue instanceof Array ? aValue[0] || '' : aValue;
            const bValueString = bValue instanceof Array ? bValue[0] || '' : bValue;
            result = aValueString.localeCompare(bValueString);
          }
        }

        if (result === 0) {
          // In case of "ties", use the title order
          result = titleOrCreatedOrder(a, b);
        }

        return sortOption.reversed ? -result : result;
      });
    }
  }

  return sortedCards;
}

function searchFilterCards(cards: Card[], board: Board, searchTextRaw: string): Card[] {
  const searchText = searchTextRaw.toLocaleLowerCase();
  if (!searchText) {
    return cards.slice();
  }

  return cards.filter((card: Card) => {
    const searchTextInCardTitle: boolean = card.title?.toLocaleLowerCase().includes(searchText);
    if (searchTextInCardTitle) {
      return true;
    }

    for (const [propertyId, propertyValue] of Object.entries(card.fields.properties)) {
      // TODO: Refactor to a shared function that returns the display value of a property
      const propertyTemplate = board.fields.cardProperties.find((o) => o.id === propertyId);
      if (propertyTemplate) {
        if (propertyTemplate.type === 'select') {
          // Look up the value of the select option
          const option = propertyTemplate.options.find((o) => o.id === propertyValue);
          if (option?.value.toLowerCase().includes(searchText)) {
            return true;
          }
        } else if (propertyTemplate.type === 'multiSelect') {
          // Look up the value of the select option
          const options = (propertyValue as string[]).map((value) =>
            propertyTemplate.options.find((o) => o.id === value)?.value.toLowerCase()
          );
          if (options?.includes(searchText)) {
            return true;
          }
        } else if ((propertyValue as string).toLowerCase().includes(searchText)) {
          return true;
        }
      }
    }

    return false;
  });
}

type getViewCardsProps = { viewId: string; boardId: string; localFilters?: FilterGroup | null };

export const makeSelectViewCardsSortedFilteredAndGrouped = () =>
  createSelector(
    (state: RootState, props: getViewCardsProps) => {
      const cards = getCards(state);
      const board = state.boards.boards[props.boardId];
      const view = state.views.views[props.viewId];
      const filter = props.localFilters || view?.fields.filter;

      return {
        cards,
        board,
        view,
        filter
      };
    },
    ({ cards, board, view, filter }) => {
      if (!view || !board || !cards) {
        return [];
      }
      const result = Object.values(cards).filter((c) => c.parentId === board.id) as Card[];
      if (view.fields.filter) {
        return CardFilter.applyFilterGroup(filter, board.fields.cardProperties, result);
      }
      return result;
    }
  );

export const makeSelectBoardTemplates = () =>
  createSelector(
    (state: RootState, boardId: string) => {
      const cards = getTemplates(state);
      return {
        cards,
        boardId
      };
    },
    ({ cards, boardId }) => {
      if (!cards) {
        return [];
      }
      return Object.values(cards).filter((c) => c.parentId === boardId) as Card[];
    }
  );
