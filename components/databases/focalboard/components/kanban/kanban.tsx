// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React, {useCallback, useState} from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import withScrolling, {createHorizontalStrength, createVerticalStrength} from 'react-dnd-scrolling'

import {Position} from '../cardDetail/cardDetailContents'

import {Board, IPropertyOption, IPropertyTemplate, BoardGroup} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {BoardView} from '../../blocks/boardView'
import mutator from '../../mutator'
import {Utils, IDType} from '../../utils'
import Button from '../../widgets/buttons/button'
import {Constants} from '../../constants'

import {dragAndDropRearrange} from '../cardDetail/cardDetailContentsUtility'

import KanbanCard from './kanbanCard'
import KanbanColumn from './kanbanColumn'
import KanbanColumnHeader from './kanbanColumnHeader'
import KanbanHiddenColumnItem from './kanbanHiddenColumnItem'

import './kanban.scss'

type Props = {
    board: Board
    activeView: BoardView
    cards: Card[]
    groupByProperty?: IPropertyTemplate
    visibleGroups: BoardGroup[]
    hiddenGroups: BoardGroup[]
    selectedCardIds: string[]
    intl: IntlShape
    readonly: boolean
    onCardClicked: (e: React.MouseEvent, card: Card) => void
    addCard: (groupByOptionId?: string, show?:boolean) => Promise<void>
    showCard: (cardId?: string) => void
}

const Kanban = (props: Props) => {
    const {board, activeView, cards, groupByProperty, visibleGroups, hiddenGroups} = props

    if (!groupByProperty) {
        Utils.assertFailure('Board views must have groupByProperty set')
        return <div/>
    }

    const propertyValues = groupByProperty.options || []
    Utils.log(`${propertyValues.length} propertyValues`)

    const visiblePropertyTemplates =
        activeView.fields.visiblePropertyIds.map((id) => board.fields.cardProperties.find((t) => t.id === id)).filter((i) => i) as IPropertyTemplate[]
    const isManualSort = activeView.fields.sortOptions.length === 0
    const visibleBadges = activeView.fields.visiblePropertyIds.includes(Constants.badgesColumnId)

    const propertyNameChanged = useCallback(async (option: IPropertyOption, text: string): Promise<void> => {
        await mutator.changePropertyOptionValue(board, groupByProperty!, option, text)
    }, [board, groupByProperty])

    const addGroupClicked = useCallback(async () => {
        Utils.log('onAddGroupClicked')

        const option: IPropertyOption = {
            id: Utils.createGuid(IDType.BlockID),
            value: 'New group',
            color: 'propColorDefault',
        }

        await mutator.insertPropertyOption(board, groupByProperty!, option, 'add group')
    }, [board, groupByProperty])

    const orderAfterMoveToColumn = useCallback((cardIds: string[], columnId?: string): string[] => {
        let cardOrder = activeView.fields.cardOrder.slice()
        const columnGroup = visibleGroups.find((g) => g.option.id === columnId)
        const columnCards = columnGroup?.cards
        if (!columnCards || columnCards.length === 0) {
            return cardOrder
        }
        const lastCardId = columnCards[columnCards.length - 1].id
        const setOfIds = new Set(cardIds)
        cardOrder = cardOrder.filter((id) => !setOfIds.has(id))
        const lastCardIndex = cardOrder.indexOf(lastCardId)
        cardOrder.splice(lastCardIndex + 1, 0, ...cardIds)
        return cardOrder
    }, [activeView, visibleGroups])

    const onDropToColumn = useCallback(async (option: IPropertyOption, card?: Card, dstOption?: IPropertyOption) => {
        const {selectedCardIds} = props
        const optionId = option ? option.id : undefined

        let draggedCardIds = selectedCardIds
        if (card) {
            draggedCardIds = Array.from(new Set(selectedCardIds).add(card.id))
        }

        if (draggedCardIds.length > 0) {
            await mutator.performAsUndoGroup(async () => {
                const cardsById: { [key: string]: Card } = cards.reduce((acc: { [key: string]: Card }, c: Card): { [key: string]: Card } => {
                    acc[c.id] = c
                    return acc
                }, {})
                const draggedCards: Card[] = draggedCardIds.map((o: string) => cardsById[o]).filter((c) => c)
                const description = draggedCards.length > 1 ? `drag ${draggedCards.length} cards` : 'drag card'
                const awaits = []
                for (const draggedCard of draggedCards) {
                    Utils.log(`ondrop. Card: ${draggedCard.title}, column: ${optionId}`)
                    const oldValue = draggedCard.fields.properties[groupByProperty!.id]
                    if (optionId !== oldValue) {
                        awaits.push(mutator.changePropertyValue(draggedCard, groupByProperty!.id, optionId, description))
                    }
                }
                const newOrder = orderAfterMoveToColumn(draggedCardIds, optionId)
                awaits.push(mutator.changeViewCardOrder(activeView, newOrder, description))
                await Promise.all(awaits)
            })
        } else if (dstOption) {
            Utils.log(`ondrop. Header option: ${dstOption.value}, column: ${option?.value}`)

            const visibleOptionIds = visibleGroups.map((o) => o.option.id)
            const srcBlockX = visibleOptionIds.indexOf(option.id)
            const dstBlockX = visibleOptionIds.indexOf(dstOption.id)

            // Here aboveRow means to the left while belowRow means to the right
            const moveTo = (srcBlockX > dstBlockX ? 'aboveRow' : 'belowRow') as Position

            const visibleOptionIdsRearranged = dragAndDropRearrange({
                contentOrder: visibleOptionIds,
                srcBlockX,
                srcBlockY: -1,
                dstBlockX,
                dstBlockY: -1,
                srcBlockId: option.id,
                dstBlockId: dstOption.id,
                moveTo,
            }) as string[]

            await mutator.changeViewVisibleOptionIds(activeView.id, activeView.fields.visibleOptionIds, visibleOptionIdsRearranged)
        }
    }, [cards, visibleGroups, activeView, groupByProperty, props.selectedCardIds])

    const onDropToCard = useCallback(async (srcCard: Card, dstCard: Card) => {
        if (srcCard.id === dstCard.id) {
            return
        }
        Utils.log(`onDropToCard: ${dstCard.title}`)
        const {selectedCardIds} = props
        const optionId = dstCard.fields.properties[groupByProperty.id]

        const draggedCardIds = Array.from(new Set(selectedCardIds).add(srcCard.id))

        const description = draggedCardIds.length > 1 ? `drag ${draggedCardIds.length} cards` : 'drag card'

        // Update dstCard order
        const cardsById: { [key: string]: Card } = cards.reduce((acc: { [key: string]: Card }, card: Card): { [key: string]: Card } => {
            acc[card.id] = card
            return acc
        }, {})
        const draggedCards: Card[] = draggedCardIds.map((o: string) => cardsById[o]).filter((c) => c)
        let cardOrder = cards.map((o) => o.id)
        const isDraggingDown = cardOrder.indexOf(srcCard.id) <= cardOrder.indexOf(dstCard.id)
        cardOrder = cardOrder.filter((id) => !draggedCardIds.includes(id))
        let destIndex = cardOrder.indexOf(dstCard.id)
        if (srcCard.fields.properties[groupByProperty!.id] === optionId && isDraggingDown) {
            // If the cards are in the same column and dragging down, drop after the target dstCard
            destIndex += 1
        }
        cardOrder.splice(destIndex, 0, ...draggedCardIds)

        await mutator.performAsUndoGroup(async () => {
            // Update properties of dragged cards
            const awaits = []
            for (const draggedCard of draggedCards) {
                Utils.log(`draggedCard: ${draggedCard.title}, column: ${optionId}`)
                const oldOptionId = draggedCard.fields.properties[groupByProperty!.id]
                if (optionId !== oldOptionId) {
                    awaits.push(mutator.changePropertyValue(draggedCard, groupByProperty!.id, optionId, description))
                }
            }
            await Promise.all(awaits)
            await mutator.changeViewCardOrder(activeView, cardOrder, description)
        })
    }, [cards, activeView, groupByProperty, props.selectedCardIds])

    const [showCalculationsMenu, setShowCalculationsMenu] = useState<Map<string, boolean>>(new Map<string, boolean>())
    const toggleOptions = (templateId: string, show: boolean) => {
        const newShowOptions = new Map<string, boolean>(showCalculationsMenu)
        newShowOptions.set(templateId, show)
        setShowCalculationsMenu(newShowOptions)
    }

    const ScrollingComponent = withScrolling('div')
    const hStrength = createHorizontalStrength(Utils.isMobile() ? 60 : 250)
    const vStrength = createVerticalStrength(Utils.isMobile() ? 60 : 250)

    return (
        <ScrollingComponent
            className='Kanban'
            horizontalStrength={hStrength}
            verticalStrength={vStrength}
        >
            <div
                className='octo-board-header'
                id='mainBoardHeader'
            >
                {/* Column headers */}

                {visibleGroups.map((group) => (
                    <KanbanColumnHeader
                        key={group.option.id}
                        group={group}
                        board={board}
                        activeView={activeView}
                        intl={props.intl}
                        groupByProperty={groupByProperty}
                        addCard={props.addCard}
                        readonly={props.readonly}
                        propertyNameChanged={propertyNameChanged}
                        onDropToColumn={onDropToColumn}
                        calculationMenuOpen={showCalculationsMenu.get(group.option.id) || false}
                        onCalculationMenuOpen={() => toggleOptions(group.option.id, true)}
                        onCalculationMenuClose={() => toggleOptions(group.option.id, false)}
                    />
                ))}

                {/* Hidden column header */}

                {hiddenGroups.length > 0 &&
                    <div className='octo-board-header-cell narrow'>
                        <FormattedMessage
                            id='BoardComponent.hidden-columns'
                            defaultMessage='Hidden columns'
                        />
                    </div>
                }

                {!props.readonly &&
                    <div className='octo-board-header-cell narrow'>
                        <Button
                            onClick={addGroupClicked}
                        >
                            <FormattedMessage
                                id='BoardComponent.add-a-group'
                                defaultMessage='+ Add a group'
                            />
                        </Button>
                    </div>
                }
            </div>

            {/* Main content */}

            <div
                className='octo-board-body'
                id='mainBoardBody'
            >
                {/* Columns */}

                {visibleGroups.map((group) => (
                    <KanbanColumn
                        key={group.option.id || 'empty'}
                        onDrop={(card: Card) => onDropToColumn(group.option, card)}
                    >
                        {group.cards.map((card) => (
                            <KanbanCard
                                card={card}
                                board={board}
                                visiblePropertyTemplates={visiblePropertyTemplates}
                                visibleBadges={visibleBadges}
                                key={card.id}
                                readonly={props.readonly}
                                isSelected={props.selectedCardIds.includes(card.id)}
                                onClick={(e) => {
                                    props.onCardClicked(e, card)
                                }}
                                onDrop={onDropToCard}
                                showCard={props.showCard}
                                isManualSort={isManualSort}
                            />
                        ))}
                        {!props.readonly &&
                        <Button
                            onClick={() => {
                                props.addCard(group.option.id, true)
                            }}
                        >
                            <FormattedMessage
                                id='BoardComponent.new'
                                defaultMessage='+ New'
                            />
                        </Button>
                        }
                    </KanbanColumn>
                ))}

                {/* Hidden columns */}

                {hiddenGroups.length > 0 &&
                <div className='octo-board-column narrow'>
                    {hiddenGroups.map((group) => (
                        <KanbanHiddenColumnItem
                            key={group.option.id}
                            group={group}
                            activeView={activeView}
                            intl={props.intl}
                            readonly={props.readonly}
                            onDrop={(card: Card) => onDropToColumn(group.option, card)}
                        />
                    ))}
                </div>}
            </div>
        </ScrollingComponent>
    )
}

export default injectIntl(Kanban)
