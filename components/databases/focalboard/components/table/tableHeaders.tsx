// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useMemo} from 'react'

import {FormattedMessage, useIntl} from 'react-intl'

import {IPropertyTemplate, Board} from '../../blocks/board'
import {createBoardView, BoardView, ISortOption} from '../../blocks/boardView'
import {Card} from '../../blocks/card'
import {Constants} from '../../constants'
import mutator from '../../mutator'
import {Utils} from '../../utils'

import {OctoUtils} from '../../octoUtils'

import './table.scss'

import TableHeader from './tableHeader'

type Props = {
    board: Board
    cards: Card[]
    activeView: BoardView
    views: BoardView[]
    readonly: boolean
    resizingColumn: string;
    offset: number;
    columnRefs: Map<string, React.RefObject<HTMLDivElement>>
}

const TableHeaders = (props: Props): JSX.Element => {
    const {board, cards, activeView, resizingColumn, views, offset, columnRefs} = props
    const intl = useIntl()

    const onAutoSizeColumn = useCallback((columnID: string, headerWidth: number) => {
        let longestSize = headerWidth
        const visibleProperties = board.fields.cardProperties.filter(() => activeView.fields.visiblePropertyIds.includes(columnID)) || []
        const columnRef = columnRefs.get(columnID)
        if (!columnRef?.current) {
            return
        }

        let template: IPropertyTemplate | undefined
        const columnFontPadding = Utils.getFontAndPaddingFromCell(columnRef.current)
        let perItemPadding = 0
        if (columnID !== Constants.titleColumnId) {
            template = visibleProperties.find((t: IPropertyTemplate) => t.id === columnID)
            if (!template) {
                return
            }
            if (template.type === 'multiSelect') {
                // For multiselect, the padding calculated above depends on the number selected when calculating the padding.
                // Need to calculate it manually here.
                // DOM Object hierarchy should be {cell -> property -> [value1, value2, etc]}
                let valueCount = 0
                if (columnRef?.current?.childElementCount > 0) {
                    const propertyElement = columnRef.current.children.item(0) as Element
                    if (propertyElement) {
                        valueCount = propertyElement.childElementCount
                        if (valueCount > 0) {
                            const statusPadding = Utils.getFontAndPaddingFromChildren(propertyElement.children, 0)
                            perItemPadding = statusPadding.padding / valueCount
                        }
                    }
                }

                // remove the "value" portion of the original calculation
                columnFontPadding.padding -= (perItemPadding * valueCount)
            }
        }

        cards.forEach((card) => {
            let thisLen = 0
            if (columnID === Constants.titleColumnId) {
                thisLen = Utils.getTextWidth(card.title, columnFontPadding.fontDescriptor) + columnFontPadding.padding
            } else if (template) {
                const displayValue = (OctoUtils.propertyDisplayValue(card, card.fields.properties[columnID], template as IPropertyTemplate, intl) || '')
                switch (template.type) {
                case 'select': {
                    thisLen = Utils.getTextWidth(displayValue.toString().toUpperCase(), columnFontPadding.fontDescriptor)
                    break
                }
                case 'multiSelect': {
                    if (displayValue) {
                        const displayValues = displayValue as string[]
                        displayValues.forEach((value) => {
                            thisLen += Utils.getTextWidth(value.toUpperCase(), columnFontPadding.fontDescriptor) + perItemPadding
                        })
                    }
                    break
                }
                default: {
                    thisLen = Utils.getTextWidth(displayValue.toString(), columnFontPadding.fontDescriptor)
                    break
                }
                }
                thisLen += columnFontPadding.padding
            }
            if (thisLen > longestSize) {
                longestSize = thisLen
            }
        })

        const columnWidths = {...activeView.fields.columnWidths}
        columnWidths[columnID] = longestSize
        const newView = createBoardView(activeView)
        newView.fields.columnWidths = columnWidths
        mutator.updateBlock(newView, activeView, 'autosize column')
    }, [activeView, board, cards])

    const visiblePropertyTemplates = useMemo(() => (
        activeView.fields.visiblePropertyIds.map((id) => board.fields.cardProperties.find((t) => t.id === id)).filter((i) => i) as IPropertyTemplate[]
    ), [board.fields.cardProperties, activeView.fields.visiblePropertyIds])

    const onDropToColumn = useCallback(async (template: IPropertyTemplate, container: IPropertyTemplate) => {
        Utils.log(`ondrop. Source column: ${template.name}, dest column: ${container.name}`)

        // Move template to new index
        const destIndex = container ? activeView.fields.visiblePropertyIds.indexOf(container.id) : 0
        await mutator.changeViewVisiblePropertiesOrder(activeView, template, destIndex >= 0 ? destIndex : 0)
    }, [activeView.fields.visiblePropertyIds])

    const titleSortOption = activeView.fields.sortOptions?.find((o) => o.propertyId === Constants.titleColumnId)
    let titleSorted: 'up' | 'down' | 'none' = 'none'
    if (titleSortOption) {
        titleSorted = titleSortOption.reversed ? 'down' : 'up'
    }

    return (
        <div
            className='octo-table-header TableHeaders'
            id='mainBoardHeader'
        >
            <TableHeader
                name={
                    <FormattedMessage
                        id='TableComponent.name'
                        defaultMessage='Name'
                    />
                }
                sorted={titleSorted}
                readonly={props.readonly}
                board={board}
                activeView={activeView}
                cards={cards}
                views={views}
                template={{id: Constants.titleColumnId, name: 'title', type: 'text', options: []}}
                offset={resizingColumn === Constants.titleColumnId ? offset : 0}
                onDrop={onDropToColumn}
                onAutoSizeColumn={onAutoSizeColumn}
            />

            {/* Table header row */}
            {visiblePropertyTemplates.map((template) => {
                let sorted: 'up' | 'down' | 'none' = 'none'
                const sortOption = activeView.fields.sortOptions.find((o: ISortOption) => o.propertyId === template.id)
                if (sortOption) {
                    sorted = sortOption.reversed ? 'down' : 'up'
                }
                return (
                    <TableHeader
                        name={template.name}
                        sorted={sorted}
                        readonly={props.readonly}
                        board={board}
                        activeView={activeView}
                        cards={cards}
                        views={views}
                        template={template}
                        key={template.id}
                        offset={resizingColumn === template.id ? offset : 0}
                        onDrop={onDropToColumn}
                        onAutoSizeColumn={onAutoSizeColumn}
                    />
                )
            })}
        </div>
    )
}

export default TableHeaders
