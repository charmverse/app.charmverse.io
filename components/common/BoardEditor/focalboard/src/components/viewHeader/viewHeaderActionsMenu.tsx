// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, { useState } from 'react'
import { IntlShape, useIntl } from 'react-intl'
import { Board } from '../../blocks/board'
import { BoardView } from '../../blocks/boardView'
import { Card } from '../../blocks/card'
import { CsvExporter } from '../../csvExporter'
import { useAppSelector } from '../../store/hooks'
import { getMe } from '../../store/users'
import { IUser } from '../../user'
import IconButton from '../../widgets/buttons/iconButton'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import { sendFlashMessage } from '../flashMessages'
import ModalWrapper from '../modalWrapper'
import ShareBoardComponent from '../shareBoardComponent'



type Props = {
    board: Board
    activeView: BoardView
    cards: Card[]
    showShared: boolean
}

function onExportCsvTrigger(board: Board, activeView: BoardView, cards: Card[], intl: IntlShape) {
    try {
        CsvExporter.exportTableCsv(board, activeView, cards, intl)
        const exportCompleteMessage = intl.formatMessage({
            id: 'ViewHeader.export-complete',
            defaultMessage: 'Export complete!',
        })
        sendFlashMessage({content: exportCompleteMessage, severity: 'normal'})
    } catch (e) {
        const exportFailedMessage = intl.formatMessage({
            id: 'ViewHeader.export-failed',
            defaultMessage: 'Export failed!',
        })
        sendFlashMessage({content: exportFailedMessage, severity: 'high'})
    }
}

const ViewHeaderActionsMenu = React.memo((props: Props) => {
    const [showShareDialog, setShowShareDialog] = useState(false)

    const {board, activeView, cards} = props
    const user = useAppSelector<IUser|null>(getMe)
    const intl = useIntl()

    const showShareBoard = user && user.id !== 'single-user' && props.showShared

    return (
        <ModalWrapper>
            <MenuWrapper label={intl.formatMessage({id: 'ViewHeader.view-menu', defaultMessage: 'View menu'})}>
                <IconButton icon={<OptionsIcon/>}/>
                <Menu>
                    <Menu.Text
                        id='exportCsv'
                        name={intl.formatMessage({id: 'ViewHeader.export-csv', defaultMessage: 'Export to CSV'})}
                        onClick={() => onExportCsvTrigger(board, activeView, cards, intl)}
                    />
                    {showShareBoard &&
                        <Menu.Text
                            id='shareBoard'
                            name={intl.formatMessage({id: 'ViewHeader.share-board', defaultMessage: 'Share board'})}
                            onClick={() => setShowShareDialog(true)}
                        />
                    }

                </Menu>
            </MenuWrapper>
            {showShareDialog &&
                <ShareBoardComponent
                    boardId={board.id || ''}
                    onClose={() => setShowShareDialog(false)}
                />
            }
        </ModalWrapper>
    )
})

export default ViewHeaderActionsMenu
