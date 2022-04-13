// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {Board, IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {ContentBlock} from '../../blocks/contentBlock'
import {useSortable} from '../../hooks/sortable'
import mutator from '../../mutator'
import {getCardComments} from '../../store/comments'
import {getCardContents} from '../../store/contents'
import {useAppSelector} from '../../store/hooks'
import {Utils} from '../../utils'
import IconButton from '../../widgets/buttons/iconButton'
import DeleteIcon from '../../widgets/icons/delete'
import DuplicateIcon from '../../widgets/icons/duplicate'
import LinkIcon from '../../widgets/icons/Link'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import Tooltip from '../../widgets/tooltip'
import {CardDetailProvider} from '../cardDetail/cardDetailContext'
import ContentElement from '../content/contentElement'
import ImageElement from '../content/imageElement'
import {sendFlashMessage} from '../flashMessages'
import PropertyValueElement from '../propertyValueElement'
import CardBadges from '../cardBadges'
import { Block } from '../../blocks/block'
import { PageContent } from 'models'
import { CharmTextBlock } from '../../blocks/charmBlock'


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
    const {card, board} = props
    
    const intl = useIntl()
    const [isDragging, isOver, cardRef] = useSortable('card', card, props.isManualSort && !props.readonly, props.onDrop)
    const contents = useAppSelector(getCardContents(card.id))
    const comments = useAppSelector(getCardComments(card.id))

    const visiblePropertyTemplates = props.visiblePropertyTemplates || []

    let className = props.isSelected ? 'GalleryCard selected' : 'GalleryCard'
    if (isOver) {
        className += ' dragover'
    }

    let galleryImageUrl: null | string = card.fields.headerImage;

    const charmTextContent = contents.find(content => (content as Block).type === "charm_text") as CharmTextBlock

    if (charmTextContent && !galleryImageUrl) {
      const { content } = charmTextContent.fields as {content: PageContent};

      if (content?.content) {
        for (let index = 0; index < content.content.length; index++) {
          const item = content.content[index];
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

    return (
        <div
            className={className}
            onClick={(e: React.MouseEvent) => props.onClick(e, card)}
            style={{opacity: isDragging ? 0.5 : 1}}
            ref={cardRef}
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
                            name={intl.formatMessage({id: 'GalleryCard.delete', defaultMessage: 'Delete'})}
                            onClick={() => mutator.deleteBlock(card, 'delete card')}
                        />
                        <Menu.Text
                            icon={<DuplicateIcon/>}
                            id='duplicate'
                            name={intl.formatMessage({id: 'GalleryCard.duplicate', defaultMessage: 'Duplicate'})}
                            onClick={() => {
                                // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DuplicateCard, {board: board.id, card: card.id})
                                mutator.duplicateCard(card.id, board)
                            }}
                        />
                        <Menu.Text
                            icon={<LinkIcon/>}
                            id='copy'
                            name={intl.formatMessage({id: 'GalleryCard.copyLink', defaultMessage: 'Copy link'})}
                            onClick={() => {
                                let cardLink = window.location.href

                                const queryString = new URLSearchParams(window.location.search)
                                if (queryString.get('cardId') !== card.id) {
                                    const newUrl = new URL(window.location.toString())
                                    newUrl.searchParams.set('cardId', card.id)
                                    cardLink = newUrl.toString()
                                }

                                Utils.copyTextToClipboard(cardLink)
                                sendFlashMessage({content: intl.formatMessage({id: 'GalleryCard.copiedLink', defaultMessage: 'Copied!'}), severity: 'high'})
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
                <CardDetailProvider card={card}>
                    <div className='gallery-item'/>
                </CardDetailProvider>}
            {props.visibleTitle &&
                <div className='gallery-title'>
                    { card.fields.icon ? <div className='octo-icon'>{card.fields.icon}</div> : undefined }
                    <div key='__title'>
                        {card.title ||
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
                                contents={contents}
                                comments={comments}
                                board={board}
                                readOnly={true}
                                card={card}
                                propertyTemplate={template}
                                showEmptyPlaceholder={false}
                            />
                        </Tooltip>
                    ))}
                </div>}
            {props.visibleBadges &&
                <CardBadges
                    card={card}
                    className='gallery-badges'
                />}
        </div>
    )
})

export default GalleryCard
