// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import { Box } from '@mui/material'
import { BountyIntegration } from 'components/bounties/BountyIntegration'
import { useRouter } from 'next/router'
import { EditorPage } from 'pages/[domain]/[pageId]'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Board } from '../../blocks/board'
import { BoardView } from '../../blocks/boardView'
import { Card } from '../../blocks/card'
import { ContentBlock } from '../../blocks/contentBlock'
import mutator from '../../mutator'
import { Focusable } from '../../widgets/editable'
import useImagePaste from './imagePaste'

type Props = {
    board: Board
    activeView: BoardView
    views: BoardView[]
    cards: Card[]
    card: Card
    contents: Array<ContentBlock|ContentBlock[]>
    readonly: boolean
}

const CardDetail = (props: Props): JSX.Element|null => {
    const {card} = props
    const router = useRouter();
    const isSharedPage = router.route.startsWith('/share')

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
      <EditorPage pageId={card.id} publicShare={isSharedPage} shouldLoadPublicPage={false}/>
    )
}

export default CardDetail
