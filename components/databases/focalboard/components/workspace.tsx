// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useEffect} from 'react'
import { generatePath } from 'lib/strings'
import { useRouter } from 'next/router';
import {FormattedMessage} from 'react-intl'

import {getCurrentBoard} from '../store/boards'
import {getCurrentViewCardsSortedFilteredAndGrouped} from '../store/cards'
import {getView, getCurrentBoardViews, getCurrentViewGroupBy, getCurrentView, getCurrentViewDisplayBy} from '../store/views'
import {useAppSelector, useAppDispatch} from '../store/hooks'

import {getClientConfig, setClientConfig} from '../store/clientConfig'

import wsClient, {WSClient} from '../wsclient'
import {ClientConfig} from '../config/clientConfig'
import {Utils} from '../utils'

import CenterPanel from './centerPanel'
import EmptyCenterPanel from './emptyCenterPanel'

import Sidebar from './sidebar/sidebar'
import './workspace.scss'

type Props = {
    readonly: boolean
}

function CenterContent(props: Props) {
    const router = useRouter()
    const board = useAppSelector(getCurrentBoard)
    const cards = useAppSelector(getCurrentViewCardsSortedFilteredAndGrouped)
    const activeView = useAppSelector(getView(router.query.viewId as string))
    const views = useAppSelector(getCurrentBoardViews)
    const groupByProperty = useAppSelector(getCurrentViewGroupBy)
    const dateDisplayProperty = useAppSelector(getCurrentViewDisplayBy)
    const clientConfig = useAppSelector(getClientConfig)
    const dispatch = useAppDispatch()

    const showCard = useCallback((cardId?: string) => {
        const params = {...router.query, cardId}
        let newPath = generatePath(router.pathname, params)
        if (props.readonly) {
            newPath += `?r=${Utils.getReadToken()}`
        }
        router.push(newPath)
    }, [router.query, history])

    useEffect(() => {
        const onConfigChangeHandler = (_: WSClient, config: ClientConfig) => {
            dispatch(setClientConfig(config))
        }
        wsClient.addOnConfigChange(onConfigChangeHandler)
        return () => {
            wsClient.removeOnConfigChange(onConfigChangeHandler)
        }
    }, [])

    if (board && activeView) {
        let property = groupByProperty
        if ((!property || property.type !== 'select') && activeView.fields.viewType === 'board') {
            property = board?.fields.cardProperties.find((o) => o.type === 'select')
        }

        let displayProperty = dateDisplayProperty
        if (!displayProperty && activeView.fields.viewType === 'calendar') {
            displayProperty = board.fields.cardProperties.find((o) => o.type === 'date')
        }

        return (
            <CenterPanel
                clientConfig={clientConfig}
                readonly={props.readonly}
                board={board}
                cards={cards}
                shownCardId={router.query.cardId as string}
                showCard={showCard}
                activeView={activeView}
                groupByProperty={property}
                dateDisplayProperty={displayProperty}
                views={views}
                showShared={clientConfig?.enablePublicSharedBoards || false}
            />
        )
    }

    return (
        <EmptyCenterPanel/>
    )
}

const Workspace = React.memo((props: Props) => {
    const board = useAppSelector(getCurrentBoard)
    const view = useAppSelector(getCurrentView)

    return (
        <div className='Workspace'>
            {!props.readonly &&
                <Sidebar
                    activeBoardId={board?.id}
                    activeViewId={view?.id}
                />
            }
            <div className='mainFrame'>
                {(board?.fields.isTemplate) &&
                <div className='banner'>
                    <FormattedMessage
                        id='Workspace.editing-board-template'
                        defaultMessage="You're editing a board template."
                    />
                </div>}
                <CenterContent
                    readonly={props.readonly}
                />
            </div>
        </div>
    )
})

export default Workspace
