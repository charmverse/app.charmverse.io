// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import { useFocalboardViews } from 'hooks/useFocalboardViews';
import { generatePath } from 'lib/utilities/strings';
import { useRouter } from 'next/router';
import React, { useCallback } from 'react';
import { injectIntl, IntlShape } from 'react-intl';
import { Block } from '../blocks/block';
import { Board } from '../blocks/board';
import { BoardView, createBoardView, IViewType } from '../blocks/boardView';
import mutator from '../mutator';
import { IDType, Utils } from '../utils';
import BoardIcon from '../widgets/icons/board';
import CalendarIcon from '../widgets/icons/calendar';
import DeleteIcon from '../widgets/icons/delete';
import DuplicateIcon from '../widgets/icons/duplicate';
import GalleryIcon from '../widgets/icons/gallery';
import TableIcon from '../widgets/icons/table';
import Menu from '../widgets/menu';


type Props = {
    board: Board,
    activeView: BoardView,
    views: BoardView[],
    intl: IntlShape
    readonly: boolean
}

export const iconForViewType = (viewType: IViewType) => {
  switch (viewType) {
  case 'board': return <BoardIcon/>
  case 'table': return <TableIcon/>
  case 'gallery': return <GalleryIcon/>
  case 'calendar': return <CalendarIcon/>
  default: return <div/>
  }
}

const ViewMenu = React.memo((props: Props) => {
    const router = useRouter()
    const {board, activeView} = props
    const { setFocalboardViewsRecord } = useFocalboardViews();

    const showView = useCallback((viewId) => {
        let newPath = generatePath(router.pathname, router.query)
        if (props.readonly) {
            newPath += `?r=${Utils.getReadToken()}`
        }
        router.push({ pathname: newPath, query: { viewId: viewId || '' } }, undefined, { shallow: true });
    }, [router.query, history])

    const handleDuplicateView = useCallback(() => {
        Utils.log('duplicateView')
        // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DuplicateBoardView, {board: board.id, view: activeView.id})
        const currentViewId = activeView.id
        const newView = createBoardView(activeView)
        newView.title = `${activeView.title} copy`
        newView.id = Utils.createGuid(IDType.View)
        mutator.insertBlock(
            newView,
            'duplicate view',
            async (block: Block) => {
                // This delay is needed because WSClient has a default 100 ms notification delay before updates
                setTimeout(() => {
                    showView(block.id)
                }, 120)
            },
            async () => {
                showView(currentViewId)
            },
        )
    }, [props.activeView, showView])

    const handleDeleteView = useCallback(() => {
        const {board, activeView, views} = props
        Utils.log('deleteView')
        // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeleteBoardView, {board: board.id, view: activeView.id})
        const view = activeView
        const nextView = views.find((o) => o !== view)
        mutator.deleteBlock(view, 'delete view')
        if (nextView) {
            showView(nextView.id)
        }
    }, [props.views, props.activeView, showView])

    const handleViewClick = useCallback((id: string) => {
        const {views} = props
        Utils.log('view ' + id)
        const view = views.find((o) => o.id === id)
        Utils.assert(view, `view not found: ${id}`)
        if (view) {
            showView(view.id)
            setFocalboardViewsRecord((focalboardViewsRecord) => ({...focalboardViewsRecord, [board.id]: view.id}))
        }
    }, [props.views, showView])


    const {views, intl} = props

    const duplicateViewText = intl.formatMessage({
        id: 'View.DuplicateView',
        defaultMessage: 'Duplicate view',
    })
    const deleteViewText = intl.formatMessage({
        id: 'View.DeleteView',
        defaultMessage: 'Delete view',
    })



    return (
        <Menu>
            {views.map((view: BoardView) => (
                <Menu.Text
                    key={view.id}
                    id={view.id}
                    name={view.title}
                    icon={iconForViewType(view.fields.viewType)}
                    onClick={handleViewClick}
                />))}
            <Menu.Separator/>
            {!props.readonly &&
                <Menu.Text
                    id='__duplicateView'
                    name={duplicateViewText}
                    icon={<DuplicateIcon/>}
                    onClick={handleDuplicateView}
                />
            }
            {!props.readonly && views.length > 1 &&
                <Menu.Text
                    id='__deleteView'
                    name={deleteViewText}
                    icon={<DeleteIcon/>}
                    onClick={handleDeleteView}
                />
            }
        </Menu>
    )
})

export default injectIntl(ViewMenu)
