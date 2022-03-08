// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import { Box } from '@mui/material'
import { BountyStatusColours } from 'components/bounties/BountyCard'
import { useBounties } from 'hooks/useBounties'
import millify from "millify"
import { BOUNTY_LABELS } from 'models'
import { CryptoCurrency, CryptoLogoPaths } from 'models/Currency'
import Image from 'next/image'
import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { Board, IPropertyTemplate } from '../../blocks/board'
import { Card } from '../../blocks/card'
import { useSortable } from '../../hooks/sortable'
import mutator from '../../mutator'
import { getCardComments } from '../../store/comments'
import { getCardContents } from '../../store/contents'
import { useAppSelector } from '../../store/hooks'
import { Utils } from '../../utils'
import IconButton from '../../widgets/buttons/iconButton'
import DeleteIcon from '../../widgets/icons/delete'
import DuplicateIcon from '../../widgets/icons/duplicate'
import LinkIcon from '../../widgets/icons/Link'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import Tooltip from '../../widgets/tooltip'
import CardBadges from '../cardBadges'
import ConfirmationDialogBox, { ConfirmationDialogBoxProps } from '../confirmationDialogBox'
import { sendFlashMessage } from '../flashMessages'
import PropertyValueElement from '../propertyValueElement'


type Props = {
    card: Card
    board: Board
    visiblePropertyTemplates: IPropertyTemplate[]
    isSelected: boolean
    visibleBadges: boolean
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
    readonly: boolean
    onDrop: (srcCard: Card, dstCard: Card) => void
    showCard: (cardId?: string) => void
    isManualSort: boolean
}

const KanbanCard = React.memo((props: Props) => {
    const {card, board} = props
    const intl = useIntl()
    const [isDragging, isOver, cardRef] = useSortable('card', card, !props.readonly, props.onDrop)
    const visiblePropertyTemplates = props.visiblePropertyTemplates || []
    let className = props.isSelected ? 'KanbanCard selected' : 'KanbanCard'
    if (props.isManualSort && isOver) {
        className += ' dragover'
    }

    const {bounties} = useBounties()
    const linkedBounty = bounties.find(bounty => bounty.linkedTaskId === card.id);

    const contents = useAppSelector(getCardContents(card.id))
    const comments = useAppSelector(getCardComments(card.id))

    const [showConfirmationDialogBox, setShowConfirmationDialogBox] = useState<boolean>(false)
    const handleDeleteCard = async () => {
        if (!card) {
            Utils.assertFailure()
            return
        }
        // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeleteCard, {board: board.id, card: card.id})
        await mutator.deleteBlock(card, 'delete card')
    }
    const confirmDialogProps: ConfirmationDialogBoxProps = {
        heading: intl.formatMessage({id: 'CardDialog.delete-confirmation-dialog-heading', defaultMessage: 'Confirm card delete?'}),
        confirmButtonText: intl.formatMessage({id: 'CardDialog.delete-confirmation-dialog-button-text', defaultMessage: 'Delete'}),
        onConfirm: handleDeleteCard,
        onClose: () => {
            setShowConfirmationDialogBox(false)
        },
    }
    const handleDeleteButtonOnClick = () => {
        // user trying to delete a card with blank name
        // but content present cannot be deleted without
        // confirmation dialog
        if (card?.title === '' && card?.fields.contentOrder.length === 0) {
            handleDeleteCard()
            return
        }
        setShowConfirmationDialogBox(true)
    }

    return (
        <>
            <div
                ref={props.readonly ? () => null : cardRef}
                className={className}
                draggable={!props.readonly}
                style={{opacity: isDragging ? 0.5 : 1}}
                onClick={props.onClick}
            >
                {!props.readonly &&
                <MenuWrapper
                    className='optionsMenu'
                    stopPropagationOnToggle={true}
                >
                    <IconButton icon={<OptionsIcon/>}/>
                    <Menu position='left'>
                        <Menu.Text
                            icon={<DeleteIcon/>}
                            id='delete'
                            name={intl.formatMessage({id: 'KanbanCard.delete', defaultMessage: 'Delete'})}
                            onClick={handleDeleteButtonOnClick}
                        />
                        <Menu.Text
                            icon={<DuplicateIcon/>}
                            id='duplicate'
                            name={intl.formatMessage({id: 'KanbanCard.duplicate', defaultMessage: 'Duplicate'})}
                            onClick={() => {
                                // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DuplicateCard, {board: board.id, card: card.id})
                                mutator.duplicateCard(
                                    card.id,
                                    board,
                                    'duplicate card',
                                    false,
                                    async (newCardId) => {
                                        props.showCard(newCardId)
                                    },
                                    async () => {
                                        props.showCard(undefined)
                                    },
                                )
                            }}
                        />
                        <Menu.Text
                            icon={<LinkIcon/>}
                            id='copy'
                            name={intl.formatMessage({id: 'KanbanCard.copyLink', defaultMessage: 'Copy link'})}
                            onClick={() => {
                                let cardLink = window.location.href

                                if (!cardLink.includes(card.id)) {
                                    cardLink += `/${card.id}`
                                }

                                Utils.copyTextToClipboard(cardLink)
                                sendFlashMessage({content: intl.formatMessage({id: 'KanbanCard.copiedLink', defaultMessage: 'Copied!'}), severity: 'high'})
                            }}
                        />
                    </Menu>
                </MenuWrapper>
                }

                <div className='octo-icontitle'>
                    <Box sx={{
                      display: "flex",
                    }}>
                      { card.fields.icon ? <div className='octo-icon'>{card.fields.icon}</div> : undefined }
                      <div
                          key='__title'
                          className='octo-titletext'
                      >
                          {card.title || intl.formatMessage({id: 'KanbanCard.untitled', defaultMessage: 'Untitled'})}
                      </div>
                    </Box>
                </div>
                {visiblePropertyTemplates.map((template) => (
                    <Tooltip
                        key={template.id}
                        title={template.name}
                    >
                        <PropertyValueElement
                            board={board}
                            readOnly={true}
                            card={card}
                            contents={contents}
                            comments={comments}
                            propertyTemplate={template}
                            showEmptyPlaceholder={false}
                        />
                    </Tooltip>
                ))}
                {linkedBounty && <Box sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%"
                  }}>
                  <Box sx={{
                    display: "flex",
                    gap: 0.25,
                  }}>
                    <Box
                      mr={0.25}
                      component='span'
                      sx={{
                        width: 15,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Image
                        loading='lazy'
                        width={15}
                        height={15}
                        src={CryptoLogoPaths[linkedBounty.rewardToken as CryptoCurrency]}
                      />
                    </Box>
                    <Box sx={{
                      display: "flex",
                      gap: 0.25
                    }}>
                      <Box component="span">
                        {linkedBounty.rewardAmount}
                      </Box>
                    </Box>
                  </Box>
                  <Box style={{
                    color: BountyStatusColours[linkedBounty.status],
                  }} sx={{
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    fontSize: 12
                  }}>
                    {BOUNTY_LABELS[linkedBounty.status]}
                  </Box>
                </Box>}
                {props.visibleBadges && <CardBadges card={card}/>}
            </div>

            {showConfirmationDialogBox && <ConfirmationDialogBox dialogBox={confirmDialogProps}/>}

        </>
    )
})

export default KanbanCard
