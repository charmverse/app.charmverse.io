// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import { Box } from '@mui/material'
import { useCurrentSpace } from 'hooks/useCurrentSpace'
import { usePages } from 'hooks/usePages'
import { BountyStatusChip } from 'components/bounties/components/BountyStatusBadge'
import { useBounties } from 'hooks/useBounties'
import { BOUNTY_LABELS, PageContent } from 'models'
import { CryptoCurrency, TokenLogoPaths } from 'connectors'
import Image from 'next/image'
import React, { useState } from 'react'
import styled from '@emotion/styled'
import { useIntl } from 'react-intl'
import { mutate } from 'swr'
import { Board, IPropertyTemplate } from '../../blocks/board'
import { Card } from '../../blocks/card'
import { useSortable } from '../../hooks/sortable'
import mutator from '../../mutator'
import { getCardComments } from '../../store/comments'
import { useAppSelector } from '../../store/hooks'
import { Utils } from '../../utils'
import IconButton from '../../widgets/buttons/iconButton'
import DeleteIcon from '../../widgets/icons/delete'
import DuplicateIcon from '@mui/icons-material/ContentCopy'
import LinkIcon from '../../widgets/icons/Link'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import Tooltip from '../../widgets/tooltip'
import ConfirmationDialogBox, { ConfirmationDialogBoxProps } from '../confirmationDialogBox'
import { sendFlashMessage } from '../flashMessages'
import PropertyValueElement from '../propertyValueElement'
import PageIcon from 'components/common/PageLayout/components/PageIcon'
import { checkForEmpty } from 'components/common/CharmEditor/utils'
import { useSnackbar } from 'hooks/useSnackbar'


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

const BountyFooter = styled.div`
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding-top: ${({ theme }) => theme.spacing(1)};
`;

const CurrencyIcon = styled.span`
  margin-right: ${({ theme }) => theme.spacing(.5)};
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const KanbanCard = React.memo((props: Props) => {
  const { card, board } = props
  const intl = useIntl()
  const [isDragging, isOver, cardRef] = useSortable('card', card, !props.readonly, props.onDrop)
  const visiblePropertyTemplates = props.visiblePropertyTemplates || []
  let className = props.isSelected ? 'KanbanCard selected' : 'KanbanCard'
  if (props.isManualSort && isOver) {
    className += ' dragover'
  }
  const [space] = useCurrentSpace()

  const { bounties } = useBounties()
  const linkedBounty = bounties.find(bounty => bounty.linkedTaskId === card.id);

  const comments = useAppSelector(getCardComments(card.id))
  const { pages, getPagePermissions } = usePages()
  const cardPage = pages[card.id]

  // Check if the current user is an admin, admin means implicit full access
  const pagePermissions = getPagePermissions(card.id)
  const [showConfirmationDialogBox, setShowConfirmationDialogBox] = useState<boolean>(false)
  const handleDeleteCard = async () => {
    if (!card) {
      Utils.assertFailure()
      return
    }
    if (pagePermissions.delete) {
      await mutator.deleteBlock(card, 'delete card')
      mutate(`pages/${space?.id}`)
    }
  }
  const confirmDialogProps: ConfirmationDialogBoxProps = {
    heading: intl.formatMessage({ id: 'CardDialog.delete-confirmation-dialog-heading', defaultMessage: 'Confirm card delete?' }),
    confirmButtonText: intl.formatMessage({ id: 'CardDialog.delete-confirmation-dialog-button-text', defaultMessage: 'Delete' }),
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

  const { showMessage } = useSnackbar()

  return (
    <>
      <div
        ref={props.readonly ? () => null : cardRef}
        className={className}
        draggable={!props.readonly}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        onClick={props.onClick}
      >
        {!props.readonly &&
          <MenuWrapper
            className='optionsMenu'
            stopPropagationOnToggle={true}
          >
            <IconButton icon={<OptionsIcon />} />
            <Menu position='bottom-start'>
              {pagePermissions.delete && pages[card.id]?.deletedAt === null && <Menu.Text
                icon={<DeleteIcon />}
                id='delete'
                name={intl.formatMessage({ id: 'KanbanCard.delete', defaultMessage: 'Delete' })}
                onClick={handleDeleteButtonOnClick}
              />}
              <Menu.Text
                icon={<DuplicateIcon color='secondary' fontSize='small' />}
                id='duplicate'
                name={intl.formatMessage({ id: 'KanbanCard.duplicate', defaultMessage: 'Duplicate' })}
                onClick={() => {
                  if (pages[card.id] && space) {
                    mutator.duplicateCard(
                      {
                        cardId: card.id,
                        board,
                        cardPage: pages[card.id]!,
                        afterRedo: async (newCardId) => {
                          props.showCard(newCardId)
                          mutate(`pages/${space.id}`)
                        },
                        beforeUndo: async () => {
                          props.showCard(undefined)
                        },
                      }
                    )
                  }
                }}
              />
              <Menu.Text
                icon={<LinkIcon />}
                id='copy'
                name={intl.formatMessage({ id: 'KanbanCard.copyLink', defaultMessage: 'Copy link' })}
                onClick={() => {
                  let cardLink = window.location.href

                  const queryString = new URLSearchParams(window.location.search)
                  if (queryString.get('cardId') !== card.id) {
                    const newUrl = new URL(window.location.toString())
                    newUrl.searchParams.set('cardId', card.id)
                    cardLink = newUrl.toString()
                  }

                  Utils.copyTextToClipboard(cardLink)
                  showMessage('Copied card link to clipboard', 'success')
                }}
              />
            </Menu>
          </MenuWrapper>
        }

        <div className='octo-icontitle'>
            <div>
            {cardPage?.icon ? <PageIcon isEditorEmpty={checkForEmpty(cardPage?.content as PageContent)} pageType="page" icon={cardPage.icon} /> : undefined}
            </div>
            <div
              key='__title'
              className='octo-titletext'
            >
              {cardPage?.title || intl.formatMessage({ id: 'KanbanCard.untitled', defaultMessage: 'Untitled' })}
            </div>
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
              updatedAt={cardPage?.updatedAt.toString() || ''}
              updatedBy={cardPage?.updatedBy || ''}
              propertyTemplate={template}
              showEmptyPlaceholder={false}
            />
          </Tooltip>
        ))}
        {linkedBounty && <BountyFooter>
          <Box sx={{
            display: "flex",
            gap: 0.25,
          }}>
            <CurrencyIcon>
              {TokenLogoPaths[linkedBounty.rewardToken as CryptoCurrency] && (<img
                loading='lazy'
                height={20}
                src={TokenLogoPaths[linkedBounty.rewardToken as CryptoCurrency]}
              />)}
            </CurrencyIcon>
            <Box sx={{
              display: "flex",
              gap: 0.25
            }}>
              <Box component="span">
                {linkedBounty.rewardAmount}
              </Box>
            </Box>
          </Box>
          <BountyStatusChip size='small' status={linkedBounty.status} />
        </BountyFooter>}
      </div>
      {showConfirmationDialogBox && <ConfirmationDialogBox dialogBox={confirmDialogProps} />}
    </>
  )
})

export default KanbanCard
