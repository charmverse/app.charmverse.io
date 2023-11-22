import type { PageMeta } from '@charmverse/core/pages';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import { tokenChainOptions } from 'components/rewards/components/RewardsBoard/utils/boardData';
import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView, ISortOption } from 'lib/focalboard/boardView';
import type { Card, CardPage } from 'lib/focalboard/card';
import { CardFilter } from 'lib/focalboard/cardFilter';
import { Constants } from 'lib/focalboard/constants';
import type { Member } from 'lib/members/interfaces';
import { PROPOSAL_REVIEWERS_BLOCK_ID } from 'lib/proposal/blocks/constants';

import { Utils } from '../utils';

import { blockLoad, initialDatabaseLoad } from './databaseBlocksLoad';

import type { RootState } from './index';

type CardsState = {
  current: string;
  cards: { [key: string]: Card };
  templates: { [key: string]: Card };
};

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
      state.cards[action.payload.id] = action.payload;
    },
    addTemplate: (state, action: PayloadAction<Card>) => {
      state.templates[action.payload.id] = action.payload;
    },
    updateCards: (state, action: PayloadAction<Card[]>) => {
      for (const card of action.payload) {
        if (card.deletedAt) {
          delete state.cards[card.id];
          delete state.templates[card.id];
        } else if (card.fields.isTemplate) {
          const cardAfterUpdate = Object.assign(state.templates[card.id] || {}, card);
          state.templates[card.id] = cardAfterUpdate;
        } else {
          const cardAfterUpdate = Object.assign(state.cards[card.id] || {}, card);
          state.cards[card.id] = cardAfterUpdate;
        }
      }
    },
    updateCard: (state, { payload }: PayloadAction<Partial<Card>>) => {
      if (payload.id) {
        const card = state.cards[payload.id];
        if (card) {
          state.cards[payload.id] = { ...card, ...payload };
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
    builder.addCase(initialDatabaseLoad.fulfilled, (state, action) => {
      state.cards = state.cards ?? {};
      state.templates = state.templates ?? {};
      for (const block of action.payload) {
        if (block.type === 'card' && block.fields.isTemplate) {
          state.templates[block.id] = block as Card;
        } else if (block.type === 'card' && !block.fields.isTemplate) {
          state.cards[block.id] = block as Card;
        }
      }
    });

    builder.addCase(blockLoad.fulfilled, (state, action) => {
      state.cards = state.cards ?? {};
      const block = action.payload;
      if (block.type === 'card') {
        state.cards[block.id] = block as Card;
      }
    });
  }
});

export const { updateCards, updateCard, addCard, addTemplate, setCurrent, deleteCards } = cardsSlice.actions;
export const { reducer } = cardsSlice;

export const getCards = (state: RootState): { [key: string]: Card } => state.cards.cards;

export const getSortedCards = createSelector(getCards, (cards) => {
  return Object.values(cards).sort((a, b) => a.title.localeCompare(b.title)) as Card[];
});

export const getTemplates = (state: RootState): { [key: string]: Card } => state.cards.templates;

export const getSortedTemplates = createSelector(getTemplates, (templates) => {
  return Object.values(templates).sort((a, b) => a.title.localeCompare(b.title)) as Card[];
});

export function getCard(cardId: string): (state: RootState) => Card | undefined {
  return (state: RootState): Card | undefined => {
    return state.cards.cards[cardId] || state.cards.templates[cardId];
  };
}

export const getCurrentBoardCards = createSelector(
  (state: RootState) => state.boards.current,
  getCards,
  (boardId: string, cards: { [key: string]: Card }) => {
    return Object.values(cards).filter((c) => c.parentId === boardId) as Card[];
  }
);

export const getCurrentBoardTemplates = createSelector(
  (state: RootState) => state.boards.current,
  getTemplates,
  (
    boardId: string,
    templates: {
      [key: string]: Card;
    }
  ) => {
    return Object.values(templates).filter((c) => c.parentId === boardId) as Card[];
  }
);

function titleOrCreatedOrder(cardA: PageMeta, cardB: PageMeta) {
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

function manualOrder(activeView: BoardView, cardA: CardPage, cardB: CardPage) {
  const indexA = activeView.fields.cardOrder.indexOf(cardA.card.id);
  const indexB = activeView.fields.cardOrder.indexOf(cardB.card.id);

  if (indexA < 0 && indexB < 0) {
    return titleOrCreatedOrder(cardA.page, cardB.page);
  } else if (indexA < 0 && indexB >= 0) {
    // If cardA's order is not defined, put it at the end
    return 1;
  }
  return indexA - indexB;
}

export function sortCards(
  cardPages: CardPage[],
  board: Board,
  activeView: BoardView,
  members: Record<string, Member>,
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
        const result = titleOrCreatedOrder(a.page, b.page);
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
          aValue = members[a.page.createdBy]?.username || '';
          bValue = members[b.page.createdBy]?.username || '';
        } else if (template.type === 'updatedBy') {
          aValue = members[a.page.updatedBy]?.username || '';
          bValue = members[b.page.updatedBy]?.username || '';
        } else if (template.type === 'date') {
          aValue = aValue === '' ? '' : JSON.parse(aValue as string).from;
          bValue = bValue === '' ? '' : JSON.parse(bValue as string).from;
        }

        let result = 0;
        if (template.type === 'number' || template.type === 'date' || template.type === 'tokenAmount') {
          // Always put empty values at the bottom
          if (aValue && !bValue) {
            return -1;
          }
          if (bValue && !aValue) {
            return 1;
          }
          if (!aValue && !bValue) {
            result = titleOrCreatedOrder(a.page, b.page);
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
            result = titleOrCreatedOrder(a.page, b.page);
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
            result = titleOrCreatedOrder(a.page, b.page);
          }

          if (template.type === 'select' || template.type === 'multiSelect') {
            aValue = template.options.find((o) => o.id === (Array.isArray(aValue) ? aValue[0] : aValue))?.value || '';
            bValue = template.options.find((o) => o.id === (Array.isArray(bValue) ? bValue[0] : bValue))?.value || '';
          }

          if (template.type === 'tokenChain') {
            aValue = tokenChainOptions.find((o) => o.id === (Array.isArray(aValue) ? aValue[0] : aValue))?.value || '';
            bValue = tokenChainOptions.find((o) => o.id === (Array.isArray(bValue) ? bValue[0] : bValue))?.value || '';
          }

          if (result === 0) {
            const aValueString = aValue instanceof Array ? aValue[0] || '' : aValue;
            const bValueString = bValue instanceof Array ? bValue[0] || '' : bValue;
            result = aValueString.localeCompare(bValueString);
          }
        }

        if (result === 0) {
          // In case of "ties", use the title order
          result = titleOrCreatedOrder(a.page, b.page);
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

type getViewCardsProps = { viewId: string; boardId: string };

export const makeSelectViewCardsSortedFilteredAndGrouped = () =>
  createSelector(
    getCards,
    (state: RootState, props: getViewCardsProps) => state.boards.boards[props.boardId],
    (state: RootState, props: getViewCardsProps) => state.views.views[props.viewId],
    (cards, board, view) => {
      if (!view || !board || !cards) {
        return [];
      }
      let result = Object.values(cards).filter((c) => c.parentId === board.id) as Card[];
      const hasTitleProperty = board.fields.cardProperties.find((o) => o.id === Constants.titleColumnId);
      const cardProperties: IPropertyTemplate[] = hasTitleProperty
        ? board.fields.cardProperties
        : [...board.fields.cardProperties, { id: Constants.titleColumnId, name: 'Title', options: [], type: 'text' }];

      if (view.fields.filter) {
        result = CardFilter.applyFilterGroup(view.fields.filter, cardProperties, result);
      }
      return result;
    }
  );
