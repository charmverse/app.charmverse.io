// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, PayloadAction, createSelector} from '@reduxjs/toolkit'

import {Card} from '../blocks/card'
import {IUser} from '../user'
import {Board} from '../blocks/board'
import {BoardView} from '../blocks/boardView'
import {Utils} from '../utils'
import {Constants} from '../constants'
import {CardFilter} from '../cardFilter'

import {initialLoad, initialReadOnlyLoad} from './initialLoad'
import {getCurrentBoard} from './boards'
import {getWorkspaceUsers} from './users'
import {getCurrentView} from './views'
import {getSearchText} from './searchText'

import {RootState} from './index'

type CardsState = {
    current: string
    cards: {[key: string]: Card}
    templates: {[key: string]: Card}
}

const cardsSlice = createSlice({
    name: 'cards',
    initialState: {
        current: '',
        cards: {},
        templates: {},
    } as CardsState,
    reducers: {
        setCurrent: (state, action: PayloadAction<string>) => {
            state.current = action.payload
        },
        addCard: (state, action: PayloadAction<Card>) => {
            state.cards[action.payload.id] = action.payload
        },
        addTemplate: (state, action: PayloadAction<Card>) => {
            state.templates[action.payload.id] = action.payload
        },
        updateCards: (state, action: PayloadAction<Card[]>) => {
            for (const card of action.payload) {
                if (card.deleteAt !== 0) {
                    delete state.cards[card.id]
                    delete state.templates[card.id]
                } else if (card.fields.isTemplate) {
                    state.templates[card.id] = card
                } else {
                    state.cards[card.id] = card
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(initialReadOnlyLoad.fulfilled, (state, action) => {
            state.cards = {}
            state.templates = {}
            for (const block of action.payload) {
                if (block.type === 'card' && block.fields.isTemplate) {
                    state.templates[block.id] = block as Card
                } else if (block.type === 'card' && !block.fields.isTemplate) {
                    state.cards[block.id] = block as Card
                }
            }
        })
        builder.addCase(initialLoad.fulfilled, (state, action) => {
            state.cards = {}
            state.templates = {}
            for (const block of action.payload.blocks) {
                if (block.type === 'card' && block.fields.isTemplate) {
                    state.templates[block.id] = block as Card
                } else if (block.type === 'card' && !block.fields.isTemplate) {
                    state.cards[block.id] = block as Card
                }
            }
        })
    },
})

export const {updateCards, addCard, addTemplate, setCurrent} = cardsSlice.actions
export const {reducer} = cardsSlice

export const getCards = (state: RootState): {[key: string]: Card} => state.cards.cards

export const getSortedCards = createSelector(
    getCards,
    (cards) => {
        return Object.values(cards).sort((a, b) => a.title.localeCompare(b.title)) as Card[]
    },
)

export const getTemplates = (state: RootState): {[key: string]: Card} => state.cards.templates

export const getSortedTemplates = createSelector(
    getTemplates,
    (templates) => {
        return Object.values(templates).sort((a, b) => a.title.localeCompare(b.title)) as Card[]
    },
)

export function getCard(cardId: string): (state: RootState) => Card|undefined {
    return (state: RootState): Card|undefined => {
        return state.cards.cards[cardId] || state.cards.templates[cardId]
    }
}

export const getCurrentBoardCards = createSelector(
    (state) => state.boards.current,
    getCards,
    (boardId, cards) => {
        return Object.values(cards).filter((c) => c.parentId === boardId) as Card[]
    },
)

export const getCurrentBoardTemplates = createSelector(
    (state) => state.boards.current,
    getTemplates,
    (boardId, templates) => {
        return Object.values(templates).filter((c) => c.parentId === boardId) as Card[]
    },
)

function titleOrCreatedOrder(cardA: Card, cardB: Card) {
    const aValue = cardA.title
    const bValue = cardB.title

    if (aValue && bValue) {
        return aValue.localeCompare(bValue)
    }

    // Always put untitled cards at the bottom
    if (aValue && !bValue) {
        return -1
    }
    if (bValue && !aValue) {
        return 1
    }

    // If both cards are untitled, use the create date
    return cardA.createAt - cardB.createAt
}

function manualOrder(activeView: BoardView, cardA: Card, cardB: Card) {
    const indexA = activeView.fields.cardOrder.indexOf(cardA.id)
    const indexB = activeView.fields.cardOrder.indexOf(cardB.id)

    if (indexA < 0 && indexB < 0) {
        return titleOrCreatedOrder(cardA, cardB)
    } else if (indexA < 0 && indexB >= 0) {
        // If cardA's order is not defined, put it at the end
        return 1
    }
    return indexA - indexB
}

function sortCards(cards: Card[], board: Board, activeView: BoardView, usersById: {[key: string]: IUser}): Card[] {
    if (!activeView) {
        return cards
    }
    const {sortOptions} = activeView.fields

    if (sortOptions.length < 1) {
        Utils.log('Manual sort')
        return cards.sort((a, b) => manualOrder(activeView, a, b))
    }

    let sortedCards = cards
    for (const sortOption of sortOptions) {
        if (sortOption.propertyId === Constants.titleColumnId) {
            Utils.log('Sort by title')
            sortedCards = sortedCards.sort((a, b) => {
                const result = titleOrCreatedOrder(a, b)
                return sortOption.reversed ? -result : result
            })
        } else {
            const sortPropertyId = sortOption.propertyId
            const template = board.fields.cardProperties.find((o) => o.id === sortPropertyId)
            if (!template) {
                Utils.logError(`Missing template for property id: ${sortPropertyId}`)
                return sortedCards
            }
            Utils.log(`Sort by property: ${template?.name}`)
            sortedCards = sortedCards.sort((a, b) => {
                // Always put cards with no titles at the bottom, regardless of sort
                if (!a.title || !b.title) {
                    return titleOrCreatedOrder(a, b)
                }

                let aValue = a.fields.properties[sortPropertyId] || ''
                let bValue = b.fields.properties[sortPropertyId] || ''

                if (template.type === 'createdBy') {
                    aValue = usersById[a.createdBy]?.username || ''
                    bValue = usersById[b.createdBy]?.username || ''
                } else if (template.type === 'updatedBy') {
                    aValue = usersById[a.modifiedBy]?.username || ''
                    bValue = usersById[b.modifiedBy]?.username || ''
                } else if (template.type === 'date') {
                    aValue = (aValue === '') ? '' : JSON.parse(aValue as string).from
                    bValue = (bValue === '') ? '' : JSON.parse(bValue as string).from
                }

                let result = 0
                if (template.type === 'number' || template.type === 'date') {
                    // Always put empty values at the bottom
                    if (aValue && !bValue) {
                        return -1
                    }
                    if (bValue && !aValue) {
                        return 1
                    }
                    if (!aValue && !bValue) {
                        return titleOrCreatedOrder(a, b)
                    }

                    result = Number(aValue) - Number(bValue)
                } else if (template.type === 'createdTime') {
                    result = a.createAt - b.createAt
                } else if (template.type === 'updatedTime') {
                    result = a.updateAt - b.updateAt
                } else {
                    // Text-based sort

                    if (aValue.length > 0 && bValue.length <= 0) {
                        return -1
                    }
                    if (bValue.length > 0 && aValue.length <= 0) {
                        return 1
                    }
                    if (aValue.length <= 0 && bValue.length <= 0) {
                        return titleOrCreatedOrder(a, b)
                    }

                    if (template.type === 'select' || template.type === 'multiSelect') {
                        aValue = template.options.find((o) => o.id === (Array.isArray(aValue) ? aValue[0] : aValue))?.value || ''
                        bValue = template.options.find((o) => o.id === (Array.isArray(bValue) ? bValue[0] : bValue))?.value || ''
                    }

                    result = (aValue as string).localeCompare(bValue as string)
                }

                if (result === 0) {
                    // In case of "ties", use the title order
                    result = titleOrCreatedOrder(a, b)
                }

                return sortOption.reversed ? -result : result
            })
        }
    }

    return sortedCards
}

function searchFilterCards(cards: Card[], board: Board, searchTextRaw: string): Card[] {
    const searchText = searchTextRaw.toLocaleLowerCase()
    if (!searchText) {
        return cards.slice()
    }

    return cards.filter((card: Card) => {
        const searchTextInCardTitle: boolean = card.title?.toLocaleLowerCase().includes(searchText)
        if (searchTextInCardTitle) {
            return true
        }

        for (const [propertyId, propertyValue] of Object.entries(card.fields.properties)) {
            // TODO: Refactor to a shared function that returns the display value of a property
            const propertyTemplate = board.fields.cardProperties.find((o) => o.id === propertyId)
            if (propertyTemplate) {
                if (propertyTemplate.type === 'select') {
                    // Look up the value of the select option
                    const option = propertyTemplate.options.find((o) => o.id === propertyValue)
                    if (option?.value.toLowerCase().includes(searchText)) {
                        return true
                    }
                } else if (propertyTemplate.type === 'multiSelect') {
                    // Look up the value of the select option
                    const options = (propertyValue as string[]).map((value) => propertyTemplate.options.find((o) => o.id === value)?.value.toLowerCase())
                    if (options?.includes(searchText)) {
                        return true
                    }
                } else if ((propertyValue as string).toLowerCase().includes(searchText)) {
                    return true
                }
            }
        }

        return false
    })
}

export const getCurrentViewCardsSortedFilteredAndGrouped = createSelector(
    getCurrentBoardCards,
    getCurrentBoard,
    getCurrentView,
    getSearchText,
    getWorkspaceUsers,
    (cards, board, view, searchText, users) => {
        if (!view || !board || !users || !cards) {
            return []
        }
        let result = cards
        if (view.fields.filter) {
            result = CardFilter.applyFilterGroup(view.fields.filter, board.fields.cardProperties, result)
        }

        if (searchText) {
            result = searchFilterCards(result, board, searchText)
        }
        result = sortCards(result, board, view, users)
        return result
    },
)
