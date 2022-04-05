// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions'
import ImageIcon from '@mui/icons-material/Image'
import { Box } from '@mui/material'
import { BountyIntegration } from 'components/bounties/BountyIntegration'
import PageBanner, { randomBannerImage } from 'components/[pageId]/DocumentPage/components/PageBanner'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { BlockIcons } from '../../blockIcons'
import { Board } from '../../blocks/board'
import { BoardView } from '../../blocks/boardView'
import { Card } from '../../blocks/card'
import { CommentBlock } from '../../blocks/commentBlock'
import { ContentBlock } from '../../blocks/contentBlock'
import mutator from '../../mutator'
import Button from '../../widgets/buttons/button'
import { Focusable } from '../../widgets/editable'
import EditableArea from '../../widgets/editableArea'
import BlockIconSelector from '../blockIconSelector'
import CardDetailContents from './cardDetailContents'
import { CardDetailProvider } from './cardDetailContext'
import CardDetailProperties from './cardDetailProperties'
import CommentsList from './commentsList'
import useImagePaste from './imagePaste'

type Props = {
    board: Board
    activeView: BoardView
    views: BoardView[]
    cards: Card[]
    card: Card
    comments: CommentBlock[]
    contents: Array<ContentBlock|ContentBlock[]>
    readonly: boolean
}

const CardDetail = (props: Props): JSX.Element|null => {
    const {card, comments} = props
    const [title, setTitle] = useState(card.title)
    const [serverTitle, setServerTitle] = useState(card.title)
    const titleRef = useRef<Focusable>(null)
    const saveTitle = useCallback(() => {
        if (title !== card.title) {
            mutator.changeTitle(card.id, card.title, title)
        }
    }, [card.title, title])

    const saveTitleRef = useRef<() => void>(saveTitle)
    saveTitleRef.current = saveTitle

    useImagePaste(card.id, card.fields.contentOrder, card.rootId)

    useEffect(() => {
        if (!title) {
            titleRef.current?.focus()
        }
        // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ViewCard, {board: props.board.id, view: props.activeView.id, card: card.id})
    }, [])

    useEffect(() => {
        if (serverTitle === title) {
            setTitle(card.title)
        }
        setServerTitle(card.title)
    }, [card.title, title])

    useEffect(() => {
        return () => {
            saveTitleRef.current && saveTitleRef.current()
        }
    }, [])

    const setRandomIcon = useCallback(() => {
        const newIcon = BlockIcons.shared.randomIcon()
        mutator.changeIcon(card.id, card.fields.icon, newIcon)
    }, [card.id, card.fields.icon])

    const setRandomHeaderImage = useCallback((headerImage?: string | null) => {
      const newHeaderImage = headerImage ?? randomBannerImage()
      // Null is passed if we want to remove the image
      mutator.changeHeaderImage(card.id, card.fields.headerImage, headerImage !== null ? newHeaderImage : null)
  }, [card.id, card.fields.headerImage])

    if (!card) {
        return null
    }

    return (
        <>
            {card.fields.headerImage && <Box width={"100%"} mb={2}>
              <PageBanner focalBoard headerImage={card.fields.headerImage} setPage={({ headerImage }) => {
                setRandomHeaderImage(headerImage!)
              }} />
            </Box>}
            <div className='CardDetail content'>
                <BlockIconSelector
                    block={card}
                    size='l'
                    readonly={props.readonly}
                />

                <Box display={"flex"} gap={1} width={"100%"}>
                  {!props.readonly && !card.fields.icon &&
                      <div className='add-buttons'>
                          <Button
                              onClick={setRandomIcon}
                              icon={<EmojiEmotionsIcon
                                fontSize='small'
                                sx={{ marginRight: 1 }}
                              />}
                          >
                              <FormattedMessage
                                  id='CardDetail.add-icon'
                                  defaultMessage='Add icon'
                              />
                          </Button>
                      </div>}
                  {!props.readonly && !card.fields.headerImage &&
                  <div className='add-buttons'>
                      <Button
                          onClick={() => setRandomHeaderImage()}
                          icon={<ImageIcon
                            fontSize='small'
                            sx={{ marginRight: 1 }}
                          />}
                      >
                          <FormattedMessage
                              id='CardDetail.add-cover'
                              defaultMessage='Add cover'
                          />
                      </Button>
                  </div>}
                </Box>

                <EditableArea
                    ref={titleRef}
                    className='title'
                    value={title}
                    placeholderText='Untitled'
                    onChange={(newTitle: string) => setTitle(newTitle)}
                    saveOnEsc={true}
                    onSave={saveTitle}
                    onCancel={() => setTitle(props.card.title)}
                    readonly={props.readonly}
                    spellCheck={true}
                />

                {/* Property list */}

                <Box sx={{
                  display: "flex",
                  gap: 1,
                  justifyContent: "space-between",
                  width: "100%"
                }}>
                  <CardDetailProperties
                      board={props.board}
                      card={props.card}
                      contents={props.contents}
                      comments={props.comments}
                      cards={props.cards}
                      activeView={props.activeView}
                      views={props.views}
                      readonly={props.readonly}
                  />
                  <BountyIntegration linkedTaskId={card.id} title={title} readonly={props.readonly} />
                </Box>

                {/* Comments */}

                <hr/>
                <CommentsList
                    comments={comments}
                    rootId={card.rootId}
                    cardId={card.id}
                    readonly={props.readonly}
                />
            </div>

            {/* Content blocks */}

            <div className='CardDetail content fullwidth content-blocks' style={{
              height: 150
            }}>
                <CardDetailProvider card={card}>
                    <CardDetailContents
                        card={props.card}
                        contents={props.contents}
                        readonly={props.readonly}
                    />
                </CardDetailProvider>
            </div>
        </>
    )
}

export default CardDetail
