// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render, screen} from '@testing-library/react'
import {Provider as ReduxProvider} from 'react-redux'

import {mocked} from 'ts-jest/utils'
import '@testing-library/jest-dom'

import userEvent from '@testing-library/user-event'

import {FilterClause} from '../../blocks/filterClause'

import {TestBlockFactory} from '../../test/testBlockFactory'
import mutator from '../../mutator'

import {wrapIntl, mockStateStore} from '../../testUtils'

import FilterComponenet from './filterComponent'

jest.mock('../../mutator')
const mockedMutator = mocked(mutator, true)
const filter: FilterClause = {
    propertyId: '1',
    condition: 'includes',
    values: ['Status'],
}

const board = TestBlockFactory.createBoard()
const activeView = TestBlockFactory.createBoardView(board)
const state = {
    users: {
        me: {
            id: 'user-id-1',
            username: 'username_1',
        },
    },
}
const store = mockStateStore([], state)
describe('components/viewHeader/filterComponent', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        board.fields.cardProperties[0].options = [{id: 'Status', value: 'Status', color: ''}]
        activeView.fields.filter.filters = [filter]
    })
    test('return filterComponent', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <FilterComponenet
                        board={board}
                        activeView={activeView}
                        onClose={jest.fn()}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getAllByRole('button', {name: 'menuwrapper'})[0]
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
    })
    test('return filterComponent and add Filter', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <FilterComponenet
                        board={board}
                        activeView={activeView}
                        onClose={jest.fn()}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getAllByRole('button', {name: 'menuwrapper'})[0]
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
        const buttonAdd = screen.getByText('+ Add filter')
        userEvent.click(buttonAdd)
        expect(mockedMutator.changeViewFilter).toBeCalledTimes(1)
    })

    test('return filterComponent and filter by status', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <FilterComponenet
                        board={board}
                        activeView={activeView}
                        onClose={jest.fn()}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getAllByRole('button', {name: 'menuwrapper'})[0]
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
        const buttonStatus = screen.getByRole('button', {name: 'Status'})
        userEvent.click(buttonStatus)
        expect(mockedMutator.changeViewFilter).toBeCalledTimes(1)
    })

    test('return filterComponent and click is empty', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <FilterComponenet
                        board={board}
                        activeView={activeView}
                        onClose={jest.fn()}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getAllByRole('button', {name: 'menuwrapper'})[1]
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
        const buttonNotInclude = screen.getByRole('button', {name: 'is empty'})
        userEvent.click(buttonNotInclude)
        expect(mockedMutator.changeViewFilter).toBeCalledTimes(1)
    })
})
