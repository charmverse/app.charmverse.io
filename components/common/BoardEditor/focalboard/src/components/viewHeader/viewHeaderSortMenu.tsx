// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback} from 'react'
import {FormattedMessage} from 'react-intl'

import {IPropertyTemplate} from '../../blocks/board'
import {BoardView, ISortOption} from '../../blocks/boardView'
import {Constants} from '../../constants'
import {Card} from '../../blocks/card'
import mutator from '../../mutator'
import Button from '../../widgets/buttons/button'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import SortDownIcon from '../../widgets/icons/sortDown'
import SortUpIcon from '../../widgets/icons/sortUp'

type Props = {
    properties: readonly IPropertyTemplate[]
    activeView: BoardView
    orderedCards: Card[]
}
const ViewHeaderSortMenu = React.memo((props: Props) => {
    const {properties, activeView, orderedCards} = props
    const hasSort = activeView.fields.sortOptions?.length > 0
    const sortDisplayOptions = properties?.map((o) => ({id: o.id, name: o.name}))
    sortDisplayOptions?.unshift({id: Constants.titleColumnId, name: 'Name'})

    const sortChanged = useCallback((propertyId: string) => {
        let newSortOptions: ISortOption[] = []
        if (activeView.fields.sortOptions && activeView.fields.sortOptions[0] && activeView.fields.sortOptions[0].propertyId === propertyId) {
            // Already sorting by name, so reverse it
            newSortOptions = [
                {propertyId, reversed: !activeView.fields.sortOptions[0].reversed},
            ]
        } else {
            newSortOptions = [
                {propertyId, reversed: false},
            ]
        }
        mutator.changeViewSortOptions(activeView.id, activeView.fields.sortOptions, newSortOptions)
    }, [activeView.id, activeView.fields.sortOptions])

    const onManualSort = useCallback(() => {
        // This sets the manual card order to the currently displayed order
        // Note: Perform this as a single update to change both properties correctly
        const newView = {...activeView, fields: {...activeView.fields}}
        newView.fields.cardOrder = orderedCards.map((o) => o.id || '') || []
        newView.fields.sortOptions = []
        mutator.updateBlock(newView, activeView, 'reorder')
    }, [activeView, orderedCards])

    const onRevertSort = useCallback(() => {
        mutator.changeViewSortOptions(activeView.id, activeView.fields.sortOptions, [])
    }, [activeView.id, activeView.fields.sortOptions])

    return (
        <MenuWrapper>
            <Button active={hasSort}>
                <FormattedMessage
                    id='ViewHeader.sort'
                    defaultMessage='Sort'
                />
            </Button>
            <Menu>
                {(activeView.fields.sortOptions?.length > 0) &&
                <>
                    <Menu.Text
                        id='manual'
                        name='Manual'
                        onClick={onManualSort}
                    />

                    <Menu.Text
                        id='revert'
                        name='Revert'
                        onClick={onRevertSort}
                    />

                    <Menu.Separator/>
                </>
                }

                {sortDisplayOptions?.map((option) => {
                    let rightIcon: JSX.Element | undefined
                    if (activeView.fields.sortOptions?.length > 0) {
                        const sortOption = activeView.fields.sortOptions[0]
                        if (sortOption.propertyId === option.id) {
                            rightIcon = sortOption.reversed ? <SortDownIcon/> : <SortUpIcon/>
                        }
                    }
                    return (
                        <Menu.Text
                            key={option.id}
                            id={option.id}
                            name={option.name}
                            rightIcon={rightIcon}
                            onClick={sortChanged}
                        />
                    )
                })}
            </Menu>
        </MenuWrapper>
    )
})

export default ViewHeaderSortMenu
