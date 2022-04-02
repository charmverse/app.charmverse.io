// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useEffect} from 'react'
import {FormattedMessage, IntlShape, useIntl} from 'react-intl'
import { generatePath } from 'lib/utilities/strings'
import { useRouter } from 'next/router'

import {Block} from '../../blocks/block'
import {Board, createBoard} from '../../blocks/board'
import {createBoardView} from '../../blocks/boardView'
import mutator from '../../mutator'
import octoClient from '../../octoClient'
import {getSortedTemplates} from '../../store/boards'
import {fetchGlobalTemplates, getGlobalTemplates} from '../../store/globalTemplates'
import {useAppDispatch, useAppSelector} from '../../store/hooks'
import AddIcon from '../../widgets/icons/add'
import BoardIcon from '../../widgets/icons/board'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'

import BoardTemplateMenuItem from './boardTemplateMenuItem'
import { Card, createCard } from '../../blocks/card'
import { CharmTextBlock, createCharmTextBlock } from '../../blocks/charmBlock'



type Props = {
    activeBoardId?: string
}

export const addBoardClicked = async (showBoard: (id: string) => void, intl: IntlShape, activeBoardId?: string) => {
    const oldBoardId = activeBoardId

    const board = createBoard(undefined, true)
    board.rootId = board.id

    const view = createBoardView()
    view.fields.viewType = 'board'
    view.parentId = board.id
    view.rootId = board.rootId
    view.title = intl.formatMessage({id: 'View.NewBoardTitle', defaultMessage: 'Board view'})

    const blocks: (Card | CharmTextBlock)[] = [];

    for (let index = 0; index < 3; index++) {
      const card = createCard()
  
      card.parentId = board.id
      card.rootId = board.rootId
      card.title = `Card ${index + 1}`
  
      const charmTextBlock = createCharmTextBlock()
      charmTextBlock.parentId = card.id
      charmTextBlock.rootId = card.rootId
      card.fields.contentOrder = [charmTextBlock.id];
      view.fields.cardOrder.push(card.id)
      blocks.push(card, charmTextBlock)
    }
    
    await mutator.insertBlocks(
        [board, view, ...blocks],
        'add board',
        async (newBlocks: Block[]) => {
            const newBoardId = newBlocks[0].id
            // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateBoard, {board: newBoardId})
            showBoard(newBoardId)
        },
        async () => {
            if (oldBoardId) {
                showBoard(oldBoardId)
            }
        },
    )
}

export const addBoardTemplateClicked = async (showBoard: (id: string) => void, intl: IntlShape, activeBoardId?: string) => {
    const boardTemplate = createBoard()
    boardTemplate.rootId = boardTemplate.id
    boardTemplate.fields.isTemplate = true
    boardTemplate.title = intl.formatMessage({id: 'View.NewTemplateTitle', defaultMessage: 'Untitled Template'})

    const view = createBoardView()
    view.fields.viewType = 'board'
    view.parentId = boardTemplate.id
    view.rootId = boardTemplate.rootId
    view.title = intl.formatMessage({id: 'View.NewBoardTitle', defaultMessage: 'Board view'})

    await mutator.insertBlocks(
        [boardTemplate, view],
        'add board template',
        async (newBlocks: Block[]) => {
            const newBoardId = newBlocks[0].id
            // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateBoardTemplate, {board: newBoardId})
            showBoard(newBoardId)
        }, async () => {
            if (activeBoardId) {
                showBoard(activeBoardId)
            }
        },
    )
}

const SidebarAddBoardMenu = (props: Props): JSX.Element => {
    const globalTemplates = useAppSelector<Board[]>(getGlobalTemplates)
    const dispatch = useAppDispatch()
    const router = useRouter()

    const showBoard = useCallback((boardId) => {
        const params: any = {...router.query, boardId: boardId || ''}
        delete params.viewId
        const newPath = generatePath(router.pathname, params)
        router.push(newPath)
    }, [router.query, history])

    useEffect(() => {
        if (octoClient.workspaceId !== '0' && globalTemplates.length === 0) {
            dispatch(fetchGlobalTemplates())
        }
    }, [octoClient.workspaceId])

    const intl = useIntl()
    const templates = useAppSelector(getSortedTemplates)

    if (!templates) {
        return <div/>
    }

    return (
        <div className='SidebarAddBoardMenu'>
            <MenuWrapper>
                <div className='menu-entry'>
                    <FormattedMessage
                        id='Sidebar.add-board'
                        defaultMessage='+ Add board'
                    />
                </div>
                <Menu position='top'>
                    {templates.length > 0 && <>
                        <Menu.Label>
                            <b>
                                <FormattedMessage
                                    id='Sidebar.select-a-template'
                                    defaultMessage='Select a template'
                                />
                            </b>
                        </Menu.Label>

                        <Menu.Separator/>
                    </>}

                    {templates.map((boardTemplate) => (
                        <BoardTemplateMenuItem
                            key={boardTemplate.id}
                            boardTemplate={boardTemplate}
                            isGlobal={false}
                            showBoard={showBoard}
                            activeBoardId={props.activeBoardId}
                        />
                    ))}

                    {globalTemplates.map((boardTemplate: Board) => (
                        <BoardTemplateMenuItem
                            key={boardTemplate.id}
                            boardTemplate={boardTemplate}
                            isGlobal={true}
                            showBoard={showBoard}
                            activeBoardId={props.activeBoardId}
                        />
                    ))}

                    <Menu.Text
                        id='empty-template'
                        name={intl.formatMessage({id: 'Sidebar.empty-board', defaultMessage: 'Empty board'})}
                        icon={<BoardIcon/>}
                        onClick={() => addBoardClicked(showBoard, intl, props.activeBoardId)}
                    />

                    <Menu.Text
                        icon={<AddIcon/>}
                        id='add-template'
                        name={intl.formatMessage({id: 'Sidebar.add-template', defaultMessage: 'New template'})}
                        onClick={() => addBoardTemplateClicked(showBoard, intl, props.activeBoardId)}
                    />
                </Menu>
            </MenuWrapper>
        </div>
    )
}

export default SidebarAddBoardMenu
