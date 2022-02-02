// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {ReactElement, ReactNode} from 'react'

import '@testing-library/jest-dom'

import {render} from '@testing-library/react'

import {wrapIntl} from '../../testUtils'

import {ContentBlock} from '../../blocks/contentBlock'

import {CardDetailProvider} from '../cardDetail/cardDetailContext'
import {TestBlockFactory} from '../../test/testBlockFactory'

import ContentElement from './contentElement'

const board = TestBlockFactory.createBoard()
const card = TestBlockFactory.createCard(board)
const contentBlock: ContentBlock = {
    id: 'test-id',
    workspaceId: '',
    parentId: card.id,
    rootId: card.rootId,
    modifiedBy: 'test-user-id',
    schema: 0,
    type: 'checkbox',
    title: 'test-title',
    fields: {},
    createdBy: 'test-user-id',
    createAt: 0,
    updateAt: 0,
    deleteAt: 0,
}

const wrap = (child: ReactNode): ReactElement => (
    wrapIntl(
        <CardDetailProvider card={card}>
            {child}
        </CardDetailProvider>,
    )
)

describe('components/content/contentElement', () => {
    it('should match snapshot for checkbox type', () => {
        const {container} = render(wrap(
            <ContentElement
                block={contentBlock}
                readonly={false}
                cords={{x: 0}}
            />,
        ))
        expect(container).toMatchSnapshot()
    })

    it('should return null for unknown type', () => {
        const block: ContentBlock = {...contentBlock, type: 'unknown'}
        const {container} = render(wrap(
            <ContentElement
                block={block}
                readonly={false}
                cords={{x: 0}}
            />,
        ))
        expect(container).toBeEmptyDOMElement()
    })
})
