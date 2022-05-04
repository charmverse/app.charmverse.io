// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect, useCallback, MouseEvent} from 'react'
import {FormattedMessage} from 'react-intl'
import { useRouter } from 'next/router'
import NextLink from 'next/link';
import Link from 'components/common/Link';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { generatePath } from 'lib/utilities/strings';
import ViewMenu, { iconForViewType } from '../viewMenu'
import ViewTabs from './viewTabs';
import AddViewMenu from '../addViewMenu'
import mutator from '../../mutator'
import {Board, IPropertyTemplate} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'
import {Card} from '../../blocks/card'
import Button from '../../widgets/buttons/button'
import CharmButton from 'components/common/Button'
import IconButton from '../../widgets/buttons/iconButton'
import DropdownIcon from '../../widgets/icons/dropdown'
import MenuWrapper from '../../widgets/menuWrapper'
import Editable from '../../widgets/editable'

import ModalWrapper from '../modalWrapper'

import NewCardButton from './newCardButton'
import ViewHeaderPropertiesMenu from './viewHeaderPropertiesMenu'
import ViewHeaderGroupByMenu from './viewHeaderGroupByMenu'
import ViewHeaderDisplayByMenu from './viewHeaderDisplayByMenu'
import ViewHeaderSortMenu from './viewHeaderSortMenu'
import ViewHeaderActionsMenu from './viewHeaderActionsMenu'
import ViewHeaderSearch from './viewHeaderSearch'
import FilterComponent from './filterComponent'


type Props = {
    board: Board
    activeView: BoardView
    views: BoardView[]
    cards: Card[]
    groupByProperty?: IPropertyTemplate
    addCard: () => void
    //addCardFromTemplate: (cardTemplateId: string) => void
    addCardTemplate: () => void
    editCardTemplate: (cardTemplateId: string) => void
    readonly: boolean
    showShared: boolean
    dateDisplayProperty?: IPropertyTemplate
}

const ViewHeader = React.memo((props: Props) => {
    const router = useRouter()
    const [showFilter, setShowFilter] = useState(false)

    const {board, activeView, views, groupByProperty, cards, showShared, dateDisplayProperty} = props

    const withGroupBy = activeView.fields.viewType === 'board' || activeView.fields.viewType === 'table'
    const withDisplayBy = activeView.fields.viewType === 'calendar'
    const withSortBy = activeView.fields.viewType !== 'calendar'

    const [viewTitle, setViewTitle] = useState(activeView.title)

    useEffect(() => {
        setViewTitle(activeView.title)
    }, [activeView.title])

    const hasFilter = activeView.fields.filter && activeView.fields.filter.filters?.length > 0

    const showView = useCallback((viewId) => {
        let newPath = generatePath(router.pathname, router.query)
        router.push({ pathname: newPath, query: { viewId: viewId || '' } }, undefined, { shallow: true });
    }, [router.query, history])


    return (
        <div className='ViewHeader'>

            <ViewTabs
                views={views}
                readonly={props.readonly}
                showView={showView}
            />

            {/* add a view */}

            {!props.readonly && (
                <AddViewMenu
                    board={board}
                    activeView={activeView}
                    views={views}
                    showView={showView}
                />
            )}


            <div className='octo-spacer'/>

            {!props.readonly &&
            <>


                {/* Card properties */}

                <ViewHeaderPropertiesMenu
                    properties={board.fields.cardProperties}
                    activeView={activeView}
                />

                {/* Group by */}

                {withGroupBy &&
                    <ViewHeaderGroupByMenu
                        properties={board.fields.cardProperties}
                        activeView={activeView}
                        groupByProperty={groupByProperty}
                    />}

                {/* Display by */}

                {withDisplayBy &&
                    <ViewHeaderDisplayByMenu
                        properties={board.fields.cardProperties}
                        activeView={activeView}
                        dateDisplayPropertyName={dateDisplayProperty?.name}
                    />}

                {/* Filter */}

                <ModalWrapper>
                    <Button
                        active={hasFilter}
                        onClick={() => setShowFilter(true)}
                    >
                        <FormattedMessage
                            id='ViewHeader.filter'
                            defaultMessage='Filter'
                        />
                    </Button>
                    {showFilter &&
                    <FilterComponent
                        board={board}
                        activeView={activeView}
                        onClose={() => setShowFilter(false)}
                    />}
                </ModalWrapper>

                {/* Sort */}

                {withSortBy &&
                    <ViewHeaderSortMenu
                        properties={board.fields.cardProperties}
                        activeView={activeView}
                        orderedCards={cards}
                    />
                }
            </>
            }

            {/* Search */}

            <ViewHeaderSearch/>

            {/* Options menu */}

            {!props.readonly &&
            <>
                <ViewHeaderActionsMenu
                    board={board}
                    activeView={activeView}
                    cards={cards}
                    showShared={showShared}
                />

                {/* New card button */}

                <NewCardButton
                    addCard={props.addCard}
                   // addCardFromTemplate={props.addCardFromTemplate}
                    addCardTemplate={props.addCardTemplate}
                    editCardTemplate={props.editCardTemplate}
                />
            </>
            }
        </div>
    )
})

export default ViewHeader
