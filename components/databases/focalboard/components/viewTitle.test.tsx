// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import '@testing-library/jest-dom'
import {act, render, screen, fireEvent} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {mocked} from 'ts-jest/utils'

import mutator from '../mutator'
import {Utils} from '../utils'
import {TestBlockFactory} from '../test/testBlockFactory'
import {mockDOM, mockStateStore, wrapIntl} from '../testUtils'

import ViewTitle from './viewTitle'

jest.mock('../mutator')
jest.mock('../utils')
jest.mock('draft-js/lib/generateRandomKey', () => () => '123')

const mockedMutator = mocked(mutator, true)
const mockedUtils = mocked(Utils, true)
mockedUtils.createGuid.mockReturnValue('test-id')

beforeAll(() => {
    mockDOM()
})

describe('components/viewTitle', () => {
    const board = TestBlockFactory.createBoard()
    board.id = 'test-id'
    board.rootId = board.id
    const state = {
        users: {
            workspaceUsers: {
                1: {username: 'abc'},
                2: {username: 'd'},
                3: {username: 'e'},
                4: {username: 'f'},
                5: {username: 'g'},
            },
        },
    }
    const store = mockStateStore([], state)

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('should match snapshot', async () => {
        let container
        await act(async () => {
            const result = render(wrapIntl(
                <ReduxProvider store={store}>
                    <ViewTitle
                        board={board}
                        readonly={false}
                    />
                </ReduxProvider>,
            ))
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot readonly', async () => {
        let container
        await act(async () => {
            const result = render(wrapIntl(
                <ReduxProvider store={store}>
                    <ViewTitle
                        board={board}
                        readonly={true}
                    />
                </ReduxProvider>,
            ))
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })

    test('show description', async () => {
        board.fields.showDescription = true
        let container
        await act(async () => {
            const result = render(wrapIntl(
                <ReduxProvider store={store}>
                    <ViewTitle
                        board={board}
                        readonly={false}
                    />
                </ReduxProvider>,
            ))
            container = result.container
        })
        expect(container).toMatchSnapshot()
        const hideDescriptionButton = screen.getAllByRole('button')[0]
        userEvent.click(hideDescriptionButton)
        expect(mockedMutator.showDescription).toBeCalledTimes(1)
    })

    test('hide description', async () => {
        board.fields.showDescription = false
        let container
        await act(async () => {
            const result = render(wrapIntl(
                <ReduxProvider store={store}>
                    <ViewTitle
                        board={board}
                        readonly={false}
                    />
                </ReduxProvider>,
            ))
            container = result.container
        })
        expect(container).toMatchSnapshot()
        const showDescriptionButton = screen.getAllByRole('button')[0]
        userEvent.click(showDescriptionButton)
        expect(mockedMutator.showDescription).toBeCalledTimes(1)
    })

    test('add random icon', async () => {
        board.fields.icon = ''
        let container
        await act(async () => {
            const result = render(wrapIntl(
                <ReduxProvider store={store}>
                    <ViewTitle
                        board={board}
                        readonly={false}
                    />
                </ReduxProvider>,
            ))
            container = result.container
        })
        expect(container).toMatchSnapshot()
        const randomIconButton = screen.getAllByRole('button')[0]
        userEvent.click(randomIconButton)
        expect(mockedMutator.changeIcon).toBeCalledTimes(1)
    })

    test('change title', async () => {
        await act(async () => {
            render(wrapIntl(
                <ReduxProvider store={store}>
                    <ViewTitle
                        board={board}
                        readonly={false}
                    />
                </ReduxProvider>,
            ))
        })
        const titleInput = screen.getAllByRole('textbox')[0]
        userEvent.type(titleInput, 'other title')
        fireEvent.blur(titleInput)
        expect(mockedMutator.changeTitle).toBeCalledTimes(1)
    })
})
