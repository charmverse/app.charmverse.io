// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { Board, IPropertyTemplate } from '../../blocks/board'
import { Card } from '../../blocks/card'
import { useSortable } from '../../hooks/sortable'
import mutator from '../../mutator'
import { getCardComments } from '../../store/comments'
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
import { sendFlashMessage } from '../flashMessages'
import PropertyValueElement from '../propertyValueElement'
import { PageContent } from 'models'
import { usePages } from 'hooks/usePages'
import { mutate } from 'swr'
import { useCurrentSpace } from 'hooks/useCurrentSpace'
import PageIcon from 'components/common/PageLayout/components/PageIcon'
import { checkForEmpty } from 'components/common/CharmEditor/utils'
import { useSnackbar } from 'hooks/useSnackbar'


type Props = {
  board: Board
  card: Card
  onClick: (e: React.MouseEvent, card: Card) => void
  visiblePropertyTemplates: IPropertyTemplate[]
  visibleTitle: boolean
  isSelected: boolean
  visibleBadges: boolean
  readonly: boolean
  isManualSort: boolean
  onDrop: (srcCard: Card, dstCard: Card) => void
}

const GalleryCard = React.memo((props: Props) => {
  const { card, board } = props

  const { pages, getPagePermissions } = usePages()
  const [space] = useCurrentSpace()
  const intl = useIntl()
  const [isDragging, isOver, cardRef] = useSortable('card', card, props.isManualSort && !props.readonly, props.onDrop)
  const comments = useAppSelector(getCardComments(card.id))
  const cardPage = pages[card.id]

  const visiblePropertyTemplates = props.visiblePropertyTemplates || []

  let className = props.isSelected ? 'GalleryCard selected' : 'GalleryCard'
  if (isOver) {
    className += ' dragover'
  }

  let galleryImageUrl: null | string | undefined = cardPage?.headerImage;
  const cardPageContent = cardPage?.content as PageContent

  if (cardPageContent && !galleryImageUrl) {
    if (cardPageContent?.content) {
      for (let index = 0; index < cardPageContent.content.length; index++) {
        const item = cardPageContent.content[index];
        if (item.type === "paragraph") {
          const imageNode = item.content?.[0]
          if (imageNode?.type === "image") {
            if (imageNode.attrs?.src) {
              galleryImageUrl = imageNode.attrs.src
              break;
            }
          }
        }
        else if (item.type === 'image') {
          if (item.attrs?.src) {
            galleryImageUrl = item.attrs.src
            break;
          }
        }
      }
    }
  }

  const { showMessage } = useSnackbar();

  const pagePermissions = getPagePermissions(card.id)

  return (
    <div
      className={className}
      onClick={(e: React.MouseEvent) => props.onClick(e, card)}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      ref={cardRef}
    >
      {!props.readonly &&
        <MenuWrapper
          className='optionsMenu'
          stopPropagationOnToggle={true}
        >
          <IconButton icon={<OptionsIcon />} />
          <Menu position='left'>
            {pagePermissions.delete && pages[card.id]?.deletedAt === null && <Menu.Text
              icon={<DeleteIcon />}
              id='delete'
              name={intl.formatMessage({ id: 'GalleryCard.delete', defaultMessage: 'Delete' })}
              onClick={() => mutator.deleteBlock(card, 'delete card')}
            />}
            <Menu.Text
              icon={<DuplicateIcon />}
              id='duplicate'
              name={intl.formatMessage({ id: 'GalleryCard.duplicate', defaultMessage: 'Duplicate' })}
              onClick={() => {
                if (pages[card.id] && space) {
                  mutator.duplicateCard({
                    cardId: card.id, board, cardPage: pages[card.id]!,
                    afterRedo: async () => {
                      mutate(`pages/${space.id}`)
                    }
                  })
                }
              }}
            />
            <Menu.Text
              icon={<LinkIcon />}
              id='copy'
              name={intl.formatMessage({ id: 'GalleryCard.copyLink', defaultMessage: 'Copy link' })}
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
      {galleryImageUrl &&
        <div className='gallery-image'>
          <img
            className='ImageElement'
            src={galleryImageUrl}
            alt={"Gallery item"}
          />
        </div>}
      {!galleryImageUrl &&
          <div className='gallery-item' />
      }
      {props.visibleTitle &&
        <div className='gallery-title'>
          {cardPage?.icon ? <PageIcon isEditorEmpty={checkForEmpty(cardPage?.content as PageContent)} pageType="card" icon={cardPage.icon} /> : undefined}
          <div key='__title'>
            {cardPage?.title ||
              <FormattedMessage
                id='KanbanCard.untitled'
                defaultMessage='Untitled'
              />}
          </div>
        </div>}
      {visiblePropertyTemplates.length > 0 &&
        <div className='gallery-props'>
          {visiblePropertyTemplates.map((template) => (
            <Tooltip
              key={template.id}
              title={template.name}
              placement='top'
            >
              <PropertyValueElement
                updatedAt={cardPage?.updatedAt.toString() || ''}
                updatedBy={cardPage?.updatedBy || ''}
                board={board}
                readOnly={true}
                card={card}
                propertyTemplate={template}
                showEmptyPlaceholder={false}
              />
            </Tooltip>
          ))}
        </div>}
    </div>
  )
})

export default GalleryCard
