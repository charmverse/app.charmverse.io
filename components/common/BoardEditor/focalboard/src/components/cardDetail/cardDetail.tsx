// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import { Box } from '@mui/material'
import { BountyIntegration } from 'components/bounties/BountyIntegration'
import { EditorPage } from 'pages/[domain]/[pageId]'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Board } from '../../blocks/board'
import { BoardView } from '../../blocks/boardView'
import { Card } from '../../blocks/card'
import { CommentBlock } from '../../blocks/commentBlock'
import { ContentBlock } from '../../blocks/contentBlock'
import mutator from '../../mutator'
import { Focusable } from '../../widgets/editable'
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

    if (!card) {
      return null
    }

    return (
      <EditorPage pageId={card.id} postPageHeaderComponent={<div className='CardDetail content'>
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

        <hr/>
        <CommentsList
            comments={comments}
            rootId={card.rootId}
            cardId={card.id}
            readonly={props.readonly}
        />
    </div>}/>
    )
}

export default CardDetail
