// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import CharmEditor from 'components/editor/CharmEditor'
import React from 'react'
import { IntlShape } from 'react-intl'
import { Card } from '../../blocks/card'
import { ContentBlock as ContentBlockType, IContentBlockWithCords } from '../../blocks/contentBlock'
import { createTextBlock } from '../../blocks/textBlock'
import { useSortableWithGrip } from '../../hooks/sortable'
import mutator from '../../mutator'
import ContentBlock from '../contentBlock'
import { dragAndDropRearrange } from './cardDetailContentsUtility'




export type Position = 'left' | 'right' | 'above' | 'below' | 'aboveRow' | 'belowRow'

type Props = {
    id?: string
    card: Card
    contents: Array<ContentBlockType|ContentBlockType[]>
    readonly: boolean
}

function addTextBlock(card: Card, intl: IntlShape, text: string): void {
    const block = createTextBlock()
    block.parentId = card.id
    block.rootId = card.rootId
    block.title = text

    mutator.performAsUndoGroup(async () => {
        const description = intl.formatMessage({id: 'CardDetail.addCardText', defaultMessage: 'add card text'})
        const insertedBlock = await mutator.insertBlock(block, description)
        const contentOrder = card.fields.contentOrder.slice()
        contentOrder.push(insertedBlock.id)
        await mutator.changeCardContentOrder(card.id, card.fields.contentOrder, contentOrder, description)
    })
}

function moveBlock(card: Card, srcBlock: IContentBlockWithCords, dstBlock: IContentBlockWithCords, intl: IntlShape, moveTo: Position): void {
    const contentOrder: Array<string|string[]> = []
    if (card.fields.contentOrder) {
        for (const contentId of card.fields.contentOrder) {
            if (typeof contentId === 'string') {
                contentOrder.push(contentId)
            } else {
                contentOrder.push(contentId.slice())
            }
        }
    }

    const srcBlockId = srcBlock.block.id
    const dstBlockId = dstBlock.block.id

    const srcBlockX = srcBlock.cords.x
    const dstBlockX = dstBlock.cords.x

    const srcBlockY = (srcBlock.cords.y || srcBlock.cords.y === 0) && (srcBlock.cords.y > -1) ? srcBlock.cords.y : -1
    const dstBlockY = (dstBlock.cords.y || dstBlock.cords.y === 0) && (dstBlock.cords.y > -1) ? dstBlock.cords.y : -1

    if (srcBlockId === dstBlockId) {
        return
    }

    const newContentOrder = dragAndDropRearrange({contentOrder, srcBlockId, srcBlockX, srcBlockY, dstBlockId, dstBlockX, dstBlockY, moveTo})

    mutator.performAsUndoGroup(async () => {
        const description = intl.formatMessage({id: 'CardDetail.moveContent', defaultMessage: 'move card content'})
        await mutator.changeCardContentOrder(card.id, card.fields.contentOrder, newContentOrder, description)
    })
}

type ContentBlockWithDragAndDropProps = {
    block: ContentBlockType | ContentBlockType[],
    x: number,
    card: Card,
    contents: Array<ContentBlockType|ContentBlockType[]>,
    intl: IntlShape,
    readonly: boolean,
}

const ContentBlockWithDragAndDrop = (props: ContentBlockWithDragAndDropProps) => {
    const [, isOver,, itemRef] = useSortableWithGrip('content', {block: props.block, cords: {x: props.x}}, true, (src, dst) => moveBlock(props.card, src, dst, props.intl, 'aboveRow'))
    const [, isOver2,, itemRef2] = useSortableWithGrip('content', {block: props.block, cords: {x: props.x}}, true, (src, dst) => moveBlock(props.card, src, dst, props.intl, 'belowRow'))

    if (Array.isArray(props.block)) {
        return (
            <div >
                <div
                    ref={itemRef}
                    className={`addToRow ${isOver ? 'dragover' : ''}`}
                    style={{width: '94%', height: '10px', marginLeft: '48px'}}
                />
                <div
                    style={{display: 'flex'}}
                >

                    {props.block.map((b, y) => (
                        <ContentBlock
                            key={b.id}
                            block={b}
                            card={props.card}
                            readonly={props.readonly}
                            width={(1 / (props.block as ContentBlockType[]).length) * 100}
                            onDrop={(src, dst, moveTo) => moveBlock(props.card, src, dst, props.intl, moveTo)}
                            cords={{x: props.x, y}}
                        />
                    ))}
                </div>
                {props.x === props.contents.length - 1 && (
                    <div
                        ref={itemRef2}
                        className={`addToRow ${isOver2 ? 'dragover' : ''}`}
                        style={{width: '94%', height: '10px', marginLeft: '48px'}}
                    />
                )}
            </div>

        )
    }

    return (
        <div>
            <div
                ref={itemRef}
                className={`addToRow ${isOver ? 'dragover' : ''}`}
                style={{width: '94%', height: '10px', marginLeft: '48px'}}
            />
            <ContentBlock
                key={props.block.id}
                block={props.block}
                card={props.card}
                readonly={props.readonly}
                onDrop={(src, dst, moveTo) => moveBlock(props.card, src, dst, props.intl, moveTo)}
                cords={{x: props.x}}
            />
            {props.x === props.contents.length - 1 && (
                <div
                    ref={itemRef2}
                    className={`addToRow ${isOver2 ? 'dragover' : ''}`}
                    style={{width: '94%', height: '10px', marginLeft: '48px'}}
                />
            )}
        </div>

    )
}

const CardDetailContents = React.memo((props: Props) => {
    return (
        <div className='octo-content CardDetailContents'>
            <div className='octo-block'>
                <CharmEditor />
            </div>
        </div>
    )
})

export default CardDetailContents
