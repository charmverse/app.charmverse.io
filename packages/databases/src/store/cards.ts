import { getChainList } from '@packages/blockchain/connectors/chains';
import type { Member } from '@packages/lib/members/interfaces';
import { PROPOSAL_REVIEWERS_BLOCK_ID } from '@packages/lib/proposals/blocks/constants';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { Board } from '../board';
import type { BoardView, ISortOption } from '../boardView';
import type { Card } from '../card';
import { CardFilter } from '../cardFilter';
import { Constants } from '../constants';
import type { FilterGroup } from '../filterGroup';
import { Utils } from '../utils';

import { blockLoad, initialDatabaseLoad } from './databaseBlocksLoad';
import { getSearchText } from './searchText';

import type { RootState } from './index';

const allChains = getChainList({ enableTestnets: true });

type CardsState = {
  // current: string;
  cards: { [key: string]: Card };
  templates: { [key: string]: Card };
};

const cardsSlice = createSlice({
  name: 'cards',
  initialState: {
    cards: {},
    templates: {}
  } as CardsState,
  reducers: {
    addCard: (state, action: PayloadAction<Card>) => {
      state.cards[action.payload.id] = action.payload;
    },
    addTemplate: (state, action: PayloadAction<Card>) => {
      state.templates[action.payload.id] = action.payload;
    },
    updateCards: (state, action: PayloadAction<(Partial<Card> & { id: string })[]>) => {
      for (const card of action.payload) {
        if (card.deletedAt) {
          delete state.cards[card.id];
          delete state.templates[card.id];
          // also check state.templates in case this is from pages_meta_updated
        } else if (card.fields?.isTemplate || state.templates[card.id]) {
          const cardAfterUpdate = Object.assign(state.templates[card.id] || {}, card);
          state.templates[card.id] = cardAfterUpdate;
        } else {
          const cardAfterUpdate = Object.assign(state.cards[card.id] || {}, card);
          state.cards[card.id] = cardAfterUpdate;
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
        state.cards[block.id] = block as Card;
      }
    });

    builder.addCase(initialDatabaseLoad.fulfilled, (state, action) => {
      for (const block of action.payload) {
        if (block.type === 'card' && block.fields.isTemplate) {
          state.templates[block.id] = block as Card;
        } else if (block.type === 'card' && !block.fields.isTemplate) {
          state.cards[block.id] = block as Card;
        }
      }
    });
  }
});

export const { updateCards, addCard, addTemplate, deleteCards } = cardsSlice.actions;
export const { reducer } = cardsSlice;

const getCards = (state: RootState): { [key: string]: Card } => state.cards.cards;

export const getAllCards = createSelector(getCards, (cards) => cards);

const getSortedCards = createSelector(getCards, (cards) => {
  return Object.values(cards).sort((a, b) => a.title.localeCompare(b.title)) as Card[];
});

export const getTemplates = (state: RootState): { [key: string]: Card } => state.cards.templates;

export function getCard(cardId: string): (state: RootState) => Card | undefined {
  return (state: RootState): Card | undefined => {
    return state.cards.cards[cardId] || state.cards.templates[cardId];
  };
}

function titleOrCreatedOrder(cardA: { createdAt: number; title: string }, cardB: { createdAt: number; title: string }) {
  const aValue = cardA.title;
  const bValue = cardB.title;

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
  return new Date(cardA.createdAt).getTime() - new Date(cardB.createdAt).getTime();
}

function manualOrder(activeView: BoardView, cardA: Card, cardB: Card) {
  const indexA = activeView.fields.cardOrder.indexOf(cardA.id);
  const indexB = activeView.fields.cardOrder.indexOf(cardB.id);

  if (indexA < 0 && indexB < 0) {
    return titleOrCreatedOrder(cardA, cardB);
  } else if (indexA < 0 && indexB >= 0) {
    // If cardA's order is not defined, put it at the end
    return 1;
  }
  return indexA - indexB;
}

export function sortCards(
  cards: Card[],
  board: Pick<Board, 'fields'>,
  activeView: BoardView,
  members: Record<string, Pick<Member, 'username'>>,
  cardTitles: Record<string, { title: string }>,
  localSort?: ISortOption[] | null
): Card[] {
  if (!activeView) {
    return cards;
  }

  const { sortOptions: globalSortOptions } = activeView.fields;
  const sortOptions = localSort || globalSortOptions;

  if (sortOptions?.length < 1) {
    return [...cards].sort((a, b) => manualOrder(activeView, a, b));
  }

  let sortedCards = [...cards];
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
        let aValue = a.fields.properties[sortPropertyId] || '';
        let bValue = b.fields.properties[sortPropertyId] || '';

        if (template.type === 'createdBy') {
          aValue = members[a.createdBy]?.username || '';
          bValue = members[b.createdBy]?.username || '';
        } else if (template.type === 'updatedBy') {
          aValue = members[a.updatedBy]?.username || '';
          bValue = members[b.updatedBy]?.username || '';
        } else if (template.type === 'date') {
          if (typeof aValue !== 'number') {
            aValue = aValue === '' ? '' : JSON.parse(aValue as string).from;
          }

          if (typeof bValue !== 'number') {
            bValue = bValue === '' ? '' : JSON.parse(bValue as string).from;
          }
        } else if (template.type === 'relation') {
          aValue = Array.isArray(aValue) ? aValue.map((pageId) => cardTitles[pageId]?.title || '').join() : '';
          bValue = Array.isArray(bValue) ? bValue.map((pageId) => cardTitles[pageId]?.title || '').join() : '';
        }

        let result = 0;
        if (
          template.type === 'number' ||
          template.type === 'date' ||
          template.type === 'tokenAmount' ||
          template.type === 'proposalEvaluationAverage' ||
          template.type === 'proposalEvaluationReviewerAverage' ||
          template.type === 'proposalEvaluationTotal' ||
          template.type === 'proposalRubricCriteriaTotal' ||
          template.type === 'proposalRubricCriteriaAverage' ||
          template.type === 'proposalPublishedAt' ||
          template.type === 'proposalEvaluationDueDate'
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
          result = a.createdAt - b.createdAt;
        } else if (template.type === 'updatedTime') {
          result = a.updatedAt - b.updatedAt;
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
          aValue = typeof value1 === 'object' && 'userId' in value1 ? members[value1.userId]?.username || '' : '';
          bValue = typeof value2 === 'object' && 'userId' in value2 ? members[value2.userId]?.username || '' : '';
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
          const valueArray =
            typeof propertyValue === 'string' ? [propertyValue] : Array.isArray(propertyValue) ? propertyValue : [];
          // Look up the value of the select option
          const values = valueArray.map((value) =>
            propertyTemplate.options.find((o) => o.id === value)?.value.toLowerCase()
          );
          if (values?.some((value) => value?.includes(searchText))) {
            return true;
          }
        } else if (typeof propertyValue === 'string' && propertyValue.toLowerCase().includes(searchText)) {
          return true;
        }
      }
    }

    return false;
  });
}

type getViewCardsProps = { viewId?: string; boardId: string; localFilters?: FilterGroup | null };

export const makeSelectViewCardsSortedFilteredAndGrouped = () =>
  createSelector(
    getCards,
    (state: RootState, props: getViewCardsProps) => state.boards.boards[props.boardId],
    getSearchText,
    (state: RootState, props: getViewCardsProps) =>
      props.localFilters || (props.viewId && state.views.views[props.viewId]?.fields.filter) || null,
    (cards, board, searchText, filter) => {
      if (!board || !cards) {
        return [];
      }
      let result = Object.values(cards).filter((c) => c.parentId === board.id) as Card[];
      if (filter) {
        result = CardFilter.applyFilterGroup(filter, board.fields.cardProperties, result);
      }
      if (searchText) {
        result = searchFilterCards(result, board, searchText);
      }
      return result;
    }
  );

export const makeSelectCardsFromBoard = () =>
  createSelector(
    getCards,
    (state: RootState, boardId: string) => boardId,
    (cards, boardId) => {
      if (!cards) {
        return [];
      }
      return Object.values(cards).filter((c) => c.parentId === boardId);
    }
  );

export const makeSelectBoardTemplates = () =>
  createSelector(
    getTemplates,
    (state: RootState, boardId: string) => boardId,
    (templates, boardId) => {
      if (!templates) {
        return [];
      }
      return Object.values(templates).filter((c) => c.parentId === boardId) as Card[];
    }
  );
