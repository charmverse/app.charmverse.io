// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {render, screen, within} from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import {createIntl} from 'react-intl'
import {mocked} from 'ts-jest/utils'

import {wrapDNDIntl} from '../../testUtils'
import Mutator from '../../mutator'
import {TestBlockFactory} from '../../test/testBlockFactory'
import {IPropertyOption} from '../../blocks/board'

import KanbanHiddenColumnItem from './kanbanHiddenColumnItem'

jest.mock('../../mutator')
const mockedMutator = mocked(Mutator, true)

describe('src/components/kanban/kanbanHiddenColumnItem', () => {
    const intl = createIntl({locale: 'en-us'})
    const board = TestBlockFactory.createBoard()
    const activeView = TestBlockFactory.createBoardView(board)
    const card = TestBlockFactory.createCard(board)
    const option:IPropertyOption = {
        id: 'id1',
        value: 'propOption',
        color: 'propColorDefault',
    }
    beforeAll(() => {
        console.error = jest.fn()
    })
    test('should match snapshot', () => {
        const {container} = render(wrapDNDIntl(
            <KanbanHiddenColumnItem
                activeView={activeView}
                group={{
                    option,
                    cards: [card],
                }}
                readonly={false}
                onDrop={jest.fn()}
                intl={intl}
            />,
        ))
        expect(container).toMatchSnapshot()
    })
    test('should match snapshot readonly', () => {
        const {container} = render(wrapDNDIntl(
            <KanbanHiddenColumnItem
                activeView={activeView}
                group={{
                    option,
                    cards: [card],
                }}
                readonly={true}
                onDrop={jest.fn()}
                intl={intl}
            />,
        ))
        expect(container).toMatchSnapshot()
    })
    test('return kanbanHiddenColumnItem and click menuwrapper', () => {
        const {container} = render(wrapDNDIntl(
            <KanbanHiddenColumnItem
                activeView={activeView}
                group={{
                    option,
                    cards: [card],
                }}
                readonly={false}
                onDrop={jest.fn()}
                intl={intl}
            />,
        ))
        const buttonMenuWrapper = screen.getByRole('button', {name: 'menuwrapper'})
        expect(buttonMenuWrapper).not.toBeNull()
        userEvent.click(buttonMenuWrapper)
        expect(container).toMatchSnapshot()
    })
    test('return kanbanHiddenColumnItem, click menuwrapper and click show', () => {
        const {container} = render(wrapDNDIntl(
            <KanbanHiddenColumnItem
                activeView={activeView}
                group={{
                    option,
                    cards: [card],
                }}
                readonly={false}
                onDrop={jest.fn()}
                intl={intl}
            />,
        ))
        const buttonMenuWrapper = screen.getByRole('button', {name: 'menuwrapper'})
        expect(buttonMenuWrapper).not.toBeNull()
        userEvent.click(buttonMenuWrapper)
        expect(container).toMatchSnapshot()
        const buttonShow = within(buttonMenuWrapper).getByRole('button', {name: 'Show'})
        userEvent.click(buttonShow)
        expect(mockedMutator.unhideViewColumn).toBeCalledWith(activeView, option.id)
    })
})
