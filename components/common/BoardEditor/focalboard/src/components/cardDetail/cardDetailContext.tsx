// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {createContext, ReactElement, ReactNode, useContext, useMemo, useState} from 'react'

import {useIntl} from 'react-intl'

import {Block} from '../../blocks/block'
import {Card} from '../../blocks/card'
import mutator from '../../mutator'

export type AddedBlock = {
    id: string
    autoAdded: boolean
}

export type CardDetailContextType = {
    card: Card
    lastAddedBlock: AddedBlock
    deleteBlock: (block: Block, index: number) => void
}

export const CardDetailContext = createContext<CardDetailContextType | null>(null)

export function useCardDetailContext(): CardDetailContextType {
    const cardDetailContext = useContext(CardDetailContext)
    if (!cardDetailContext) {
        throw new Error('CardDetailContext is not available!')
    }
    return cardDetailContext
}

type CardDetailProps = {
    card: Card
    children: ReactNode
}

export const CardDetailProvider = (props: CardDetailProps): ReactElement => {
    const intl = useIntl()
    const [lastAddedBlock, setLastAddedBlock] = useState<AddedBlock>({
        id: '',
        autoAdded: false,
    })
    const {card} = props
    const contextValue = useMemo(() => ({
        card,
        lastAddedBlock,
        deleteBlock: async (block: Block, index: number) => {
            const contentOrder = card.fields.contentOrder.slice()
            contentOrder.splice(index, 1)
            const description = intl.formatMessage({id: 'ContentBlock.DeleteAction', defaultMessage: 'delete'})
            await mutator.performAsUndoGroup(async () => {
                await mutator.deleteBlock(block, description)
                await mutator.changeCardContentOrder(card.id, card.fields.contentOrder, contentOrder, description)
            })
        },
    }), [card, lastAddedBlock, intl])
    return (
        <CardDetailContext.Provider value={contextValue}>
            {props.children}
        </CardDetailContext.Provider>
    )
}
