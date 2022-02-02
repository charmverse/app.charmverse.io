// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'

import {render, screen} from '@testing-library/react'
import '@testing-library/jest-dom'

import {TestBlockFactory} from '../test/testBlockFactory'
import {blocksById, mockStateStore, wrapDNDIntl} from '../testUtils'

import {RootState} from '../store'

import {CommentBlock} from '../blocks/commentBlock'

import {CheckboxBlock} from '../blocks/checkboxBlock'

import CardBadges from './cardBadges'

describe('components/cardBadges', () => {
    const board = TestBlockFactory.createBoard()
    const card = TestBlockFactory.createCard(board)
    const emptyCard = TestBlockFactory.createCard(board)
    const text = TestBlockFactory.createText(card)
    text.title = `
                ## Header
                - [x] one
                - [ ] two
                - [x] three
   `.replace(/\n\s+/gm, '\n')
    const comments = Array.from(Array<CommentBlock>(3), () => TestBlockFactory.createComment(card))
    const checkboxes = Array.from(Array<CheckboxBlock>(4), () => TestBlockFactory.createCheckbox(card))
    checkboxes[2].fields.value = true

    const state: Partial<RootState> = {
        cards: {
            current: '',
            cards: blocksById([card, emptyCard]),
            templates: {},
        },
        comments: {
            comments: blocksById(comments),
        },
        contents: {
            contents: {
                ...blocksById([text]),
                ...blocksById(checkboxes),
            },
        },
    }
    const store = mockStateStore([], state)

    it('should match snapshot', () => {
        const {container} = render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <CardBadges card={card}/>
            </ReduxProvider>,
        ))
        expect(container).toMatchSnapshot()
    })

    it('should match snapshot for empty card', () => {
        const {container} = render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <CardBadges card={emptyCard}/>
            </ReduxProvider>,
        ))
        expect(container).toMatchSnapshot()
    })

    it('should render correct values', () => {
        render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <CardBadges card={card}/>
            </ReduxProvider>,
        ))
        expect(screen.getByTitle(/card has a description/)).toBeInTheDocument()
        expect(screen.getByTitle('Comments')).toHaveTextContent('3')
        expect(screen.getByTitle('Checkboxes')).toHaveTextContent('3/7')
    })
})
