// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'
import {batch} from 'react-redux'
import {FormattedMessage, useIntl} from 'react-intl'
import { generatePath } from 'lib/strings'
import { useRouter } from 'next/router'
import {useHotkeys} from 'react-hotkeys-hook'

import {Block} from '../blocks/block'
import {ContentBlock} from '../blocks/contentBlock'
import {CommentBlock} from '../blocks/commentBlock'
import {Board} from '../blocks/board'
import {Card} from '../blocks/card'
import {BoardView} from '../blocks/boardView'
import {sendFlashMessage} from '../components/flashMessages'
import Workspace from '../components/workspace'
import mutator from '../mutator'
import octoClient from '../octoClient'
import {Utils} from '../utils'
import wsClient, {Subscription, WSClient} from '../wsclient'
import {updateBoards, getCurrentBoard, setCurrent as setCurrentBoard} from '../store/boards'
import {updateViews, getCurrentView, setCurrent as setCurrentView, getCurrentBoardViews} from '../store/views'
import {updateCards} from '../store/cards'
import {updateContents} from '../store/contents'
import {updateComments} from '../store/comments'
import {initialLoad, initialReadOnlyLoad} from '../store/initialLoad'
import {useAppSelector, useAppDispatch} from '../store/hooks'
import {UserSettings} from '../userSettings'

import IconButton from '../widgets/buttons/iconButton'
import CloseIcon from '../widgets/icons/close'

// import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../telemetry/telemetryClient'
import {fetchUserBlockSubscriptions, followBlock, getMe, unfollowBlock} from '../store/users'
import {IUser} from '../user'
type Props = {
    readonly?: boolean
}

const websocketTimeoutForBanner = 5000

const BoardPage = (props: Props): JSX.Element => {
    const intl = useIntl()
    const board = useAppSelector(getCurrentBoard)
    const activeView = useAppSelector(getCurrentView)
    const boardViews = useAppSelector(getCurrentBoardViews)
    const dispatch = useAppDispatch()
    console.log('board', board)
    console.log('activeView', activeView)
    const router = useRouter()
    const [websocketClosed, setWebsocketClosed] = useState(false)
    const queryString = new URLSearchParams(router.query as { [key: string]: string })
    const [mobileWarningClosed, setMobileWarningClosed] = useState(UserSettings.mobileWarningClosed)
    const me = useAppSelector<IUser|null>(getMe)

    let workspaceId = router.query.workspaceId as string || UserSettings.lastWorkspaceId || '0'

    // if we're in a legacy route and not showing a shared board,
    // redirect to the new URL schema equivalent
    if (Utils.isFocalboardLegacy() && !props.readonly) {
        window.location.href = window.location.href.replace('/plugins/focalboard', '/boards')
    }

    // TODO: Make this less brittle. This only works because this is the root render function
    useEffect(() => {
        workspaceId = router.query.workspaceId as string || workspaceId
        UserSettings.lastWorkspaceId = workspaceId
        octoClient.workspaceId = workspaceId
    }, [router.query.workspaceId])

    // Load user's block subscriptions when workspace changes
    // block subscriptions are relevant only in plugin mode.
    if (Utils.isFocalboardPlugin()) {
        useEffect(() => {
            if (!me) {
                return
            }

            dispatch(fetchUserBlockSubscriptions(me!.id))
        }, [router.query.workspaceId])
    }

    // Backward compatibility: This can be removed in the future, this is for
    // transform the old query params into routes
    useEffect(() => {
    }, [])

    useEffect(() => {
        // don't do anything if-
        // 1. the URL already has a workspace ID, or
        // 2. the workspace ID is unavailable.
        // This also ensures once the workspace id is
        // set in the URL, we don't update the history anymore.
        if (props.readonly || router.query.workspaceId || !workspaceId || workspaceId === '0') {
            return
        }

        // we can pick workspace ID from board if it's not available anywhere,
        const workspaceIDToUse = workspaceId || board.workspaceId

        const newPath = Utils.buildOriginalPath(workspaceIDToUse, router.query.pageId as string, router.query.viewId as string, router.query.cardId as string)
        router.replace(`/workspace/${newPath}`)
    }, [workspaceId, router.query.pageId, router.query.viewId, router.query.cardId])

    useEffect(() => {
        // Backward compatibility: This can be removed in the future, this is for
        // transform the old query params into routes
        const queryBoardId = queryString.get('id')
        const params = {...router.query}
        let needsRedirect = false
        if (queryBoardId) {
            params.pageId = queryBoardId
            needsRedirect = true
        }
        const queryViewId = queryString.get('v')
        if (queryViewId) {
            params.viewId = queryViewId
            needsRedirect = true
        }
        const queryCardId = queryString.get('c')
        if (queryCardId) {
            params.cardId = queryCardId
            needsRedirect = true
        }
        if (needsRedirect) {
            const newPath = generatePath(router.pathname, params)
            router.replace(newPath)
            return
        }

        // Backward compatibility end
        const pageId = router.query.pageId as string
        const viewId = router.query.viewId === '0' ? '' : router.query.viewId as string

        if (!pageId) {
            // Load last viewed boardView
            const lastBoardId = UserSettings.lastBoardId || undefined
            const lastViewId = UserSettings.lastViewId || undefined
            if (lastBoardId) {
                let newPath = generatePath(router.pathname, {...router.query, pageId: lastBoardId})
                if (lastViewId) {
                    newPath = generatePath(router.pathname, {...router.query, pageId: lastBoardId, viewId: lastViewId})
                }
                router.replace(newPath)
                return
            }
            return
        }

        Utils.log(`attachToBoard: ${pageId}`)

        // Ensure boardViews is for our pageId before redirecting
        const isCorrectBoardView = boardViews.length > 0 && boardViews[0].parentId === pageId
        if (!viewId && isCorrectBoardView) {
            const newPath = generatePath(router.pathname, {...router.query, pageId, viewId: boardViews[0].id})
            console.log(newPath)
            router.replace(newPath)
            return
        }

        UserSettings.lastBoardId = pageId || ''
        UserSettings.lastViewId = viewId || ''
        UserSettings.lastWorkspaceId = workspaceId

        dispatch(setCurrentBoard(pageId || ''))
        dispatch(setCurrentView(viewId || ''))
    }, [router.query.pageId, router.query.viewId, boardViews])

    useEffect(() => {
        Utils.setFavicon(board?.fields.icon)
    }, [board?.fields.icon])

    useEffect(() => {
        if (board) {
            let title = `${board.title}`
            if (activeView?.title) {
                title += ` | ${activeView.title}`
            }
            document.title = title
        } else if (Utils.isFocalboardPlugin()) {
            document.title = 'Boards - Mattermost'
        } else {
            document.title = 'Focalboard'
        }
    }, [board?.title, activeView?.title])

    if (props.readonly) {
        useEffect(() => {
            if (board?.id && activeView?.id) {
                // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ViewSharedBoard, {board: board?.id, view: activeView?.id})
            }
        }, [board?.id, activeView?.id])
    }

    useEffect(() => {
        let loadAction: any = initialLoad /* eslint-disable-line @typescript-eslint/no-explicit-any */
        let token = localStorage.getItem('focalboardSessionId') || ''
        if (props.readonly) {
            loadAction = initialReadOnlyLoad
            token = token || queryString.get('r') || ''
        }

        dispatch(loadAction(router.query.pageId))

        let subscribedToWorkspace = false
        if (wsClient.state === 'open') {
            wsClient.authenticate(router.query.workspaceId as string || '0', token)
            wsClient.subscribeToWorkspace(router.query.workspaceId as string || '0')
            subscribedToWorkspace = true
        }

        const incrementalUpdate = (_: WSClient, blocks: Block[]) => {
            // only takes into account the blocks that belong to the workspace
            const workspaceBlocks = blocks.filter((b: Block) => b.workspaceId === '0' || b.workspaceId === workspaceId)

            batch(() => {
                dispatch(updateBoards(workspaceBlocks.filter((b: Block) => b.type === 'board' || b.deleteAt !== 0) as Board[]))
                dispatch(updateViews(workspaceBlocks.filter((b: Block) => b.type === 'view' || b.deleteAt !== 0) as BoardView[]))
                dispatch(updateCards(workspaceBlocks.filter((b: Block) => b.type === 'card' || b.deleteAt !== 0) as Card[]))
                dispatch(updateComments(workspaceBlocks.filter((b: Block) => b.type === 'comment' || b.deleteAt !== 0) as CommentBlock[]))
                dispatch(updateContents(workspaceBlocks.filter((b: Block) => b.type !== 'card' && b.type !== 'view' && b.type !== 'board' && b.type !== 'comment') as ContentBlock[]))
            })
        }

        let timeout: ReturnType<typeof setTimeout>
        const updateWebsocketState = (_: WSClient, newState: 'init'|'open'|'close'): void => {
            if (newState === 'open') {
                const newToken = localStorage.getItem('focalboardSessionId') || ''
                wsClient.authenticate(router.query.workspaceId as string || '0', newToken)
                wsClient.subscribeToWorkspace(router.query.workspaceId as string || '0')
                subscribedToWorkspace = true
            }

            if (timeout) {
                clearTimeout(timeout)
            }

            if (newState === 'close') {
                timeout = setTimeout(() => {
                    setWebsocketClosed(true)
                    subscribedToWorkspace = false
                }, websocketTimeoutForBanner)
            } else {
                setWebsocketClosed(false)
            }
        }

        wsClient.addOnChange(incrementalUpdate)
        wsClient.addOnReconnect(() => dispatch(loadAction(router.query.pageId)))
        wsClient.addOnStateChange(updateWebsocketState)
        wsClient.setOnFollowBlock((_: WSClient, subscription: Subscription): void => {
            if (subscription.subscriberId === me?.id && subscription.workspaceId === router.query.workspaceId) {
                dispatch(followBlock(subscription))
            }
        })
        wsClient.setOnUnfollowBlock((_: WSClient, subscription: Subscription): void => {
            if (subscription.subscriberId === me?.id && subscription.workspaceId === router.query.workspaceId) {
                dispatch(unfollowBlock(subscription))
            }
        })
        return () => {
            if (timeout) {
                clearTimeout(timeout)
            }
            if (subscribedToWorkspace) {
                wsClient.unsubscribeToWorkspace(router.query.workspaceId as string || '0')
            }
            wsClient.removeOnChange(incrementalUpdate)
            wsClient.removeOnReconnect(() => dispatch(loadAction(router.query.pageId)))
            wsClient.removeOnStateChange(updateWebsocketState)
        }
    }, [router.query.workspaceId, props.readonly, router.query.pageId])

    useHotkeys('ctrl+z,cmd+z', () => {
        Utils.log('Undo')
        if (mutator.canUndo) {
            const description = mutator.undoDescription
            mutator.undo().then(() => {
                if (description) {
                    sendFlashMessage({content: `Undo ${description}`, severity: 'low'})
                } else {
                    sendFlashMessage({content: 'Undo', severity: 'low'})
                }
            })
        } else {
            sendFlashMessage({content: 'Nothing to Undo', severity: 'low'})
        }
    })

    useHotkeys('shift+ctrl+z,shift+cmd+z', () => {
        Utils.log('Redo')
        if (mutator.canRedo) {
            const description = mutator.redoDescription
            mutator.redo().then(() => {
                if (description) {
                    sendFlashMessage({content: `Redo ${description}`, severity: 'low'})
                } else {
                    sendFlashMessage({content: 'Redu', severity: 'low'})
                }
            })
        } else {
            sendFlashMessage({content: 'Nothing to Redo', severity: 'low'})
        }
    })

    return (
        <div className='BoardPage'>
            {websocketClosed &&
                <div className='WSConnection error'>
                    <a
                        href='https://www.focalboard.com/fwlink/websocket-connect-error.html'
                        target='_blank'
                        rel='noreferrer'
                    >
                        <FormattedMessage
                            id='Error.websocket-closed'
                            defaultMessage='Websocket connection closed, connection interrupted. If this persists, check your server or web proxy configuration.'
                        />
                    </a>
                </div>}

            {!mobileWarningClosed &&
                <div className='mobileWarning'>
                    <div>
                        <FormattedMessage
                            id='Error.mobileweb'
                            defaultMessage='Mobile web support is currently in early beta. Not all functionality may be present.'
                        />
                    </div>
                    <IconButton
                        onClick={() => {
                            UserSettings.mobileWarningClosed = true
                            setMobileWarningClosed(true)
                        }}
                        icon={<CloseIcon/>}
                        title='Close'
                        className='margin-right'
                    />
                </div>}

            {props.readonly && board === undefined &&
                <div className='error'>
                    {intl.formatMessage({id: 'BoardPage.syncFailed', defaultMessage: 'Board may be deleted or access revoked.'})}
                </div>}
            <Workspace
                readonly={props.readonly || false}
            />
        </div>
    )
}

export default BoardPage
