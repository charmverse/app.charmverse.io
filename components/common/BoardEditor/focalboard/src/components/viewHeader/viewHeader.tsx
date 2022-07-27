// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import { useRouter } from 'next/router';
import React, { useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Board, IPropertyTemplate } from '../../blocks/board';
import { BoardView } from '../../blocks/boardView';
import { Card } from '../../blocks/card';
import Button from '../../widgets/buttons/button';
import AddViewMenu from '../addViewMenu';
import ViewTabs from './viewTabs';

import ModalWrapper from '../modalWrapper';

import FilterComponent from './filterComponent';
import NewCardButton from './newCardButton';
import ViewHeaderActionsMenu from './viewHeaderActionsMenu';
import ViewHeaderDisplayByMenu from './viewHeaderDisplayByMenu';
import ViewHeaderGroupByMenu from './viewHeaderGroupByMenu';
import ViewHeaderPropertiesMenu from './viewHeaderPropertiesMenu';
import ViewHeaderSearch from './viewHeaderSearch';
import ViewHeaderSortMenu from './viewHeaderSortMenu';

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
    dateDisplayProperty?: IPropertyTemplate
}

const ViewHeader = React.memo((props: Props) => {
    const router = useRouter()
    const [showFilter, setShowFilter] = useState(false)

    const {board, activeView, views, groupByProperty, cards, dateDisplayProperty} = props

    const withGroupBy = activeView.fields.viewType === 'board' || activeView.fields.viewType === 'table'
    const withDisplayBy = activeView.fields.viewType === 'calendar'
    const withSortBy = activeView.fields.viewType !== 'calendar'

    const hasFilter = activeView.fields.filter && activeView.fields.filter.filters?.length > 0

    const showView = useCallback((viewId) => {
        router.push({ pathname: router.pathname, query: {
            ...router.query,
            viewId: viewId || ''
        } }, undefined, { shallow: true });
    }, [router.query, history])


    return (
        <div className='ViewHeader'>

            <ViewTabs
                views={views}
                readonly={props.readonly}
                showView={showView}
                board={board}
                activeView={activeView}
            />

            {/* add a view */}

            {!props.readonly && views.length <= 3 && (
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

            {/* Search - disabled until we can access page data inside the redux selector */}

            {/* <ViewHeaderSearch/> */}

            {/* Options menu */}

            {!props.readonly &&
            <>
                <ViewHeaderActionsMenu
                    board={board}
                    activeView={activeView}
                    cards={cards}
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
