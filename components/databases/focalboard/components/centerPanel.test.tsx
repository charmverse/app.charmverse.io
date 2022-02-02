// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {fireEvent, render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import {mocked} from 'ts-jest/utils'
import {Provider as ReduxProvider} from 'react-redux'

import {mockDOM, mockStateStore, wrapDNDIntl} from '../testUtils'
import {TestBlockFactory} from '../test/testBlockFactory'
import {IPropertyTemplate} from '../blocks/board'
import {Utils} from '../utils'
import Mutator from '../mutator'
import {Constants} from '../constants'

import CenterPanel from './centerPanel'
Object.defineProperty(Constants, 'versionString', {value: '1.0.0'})
jest.mock('react-router-dom', () => {
    const originalModule = jest.requireActual('react-router-dom')

    return {
        ...originalModule,
        useRouteMatch: jest.fn(() => {
            return {url: '/board/view'}
        }),
    }
})
jest.mock('../utils')
jest.mock('../mutator')
jest.mock('../telemetry/telemetryClient')
jest.mock('draft-js/lib/generateRandomKey', () => () => '123')
const mockedUtils = mocked(Utils, true)
const mockedMutator = mocked(Mutator, true)
mockedUtils.createGuid.mockReturnValue('test-id')
describe('components/centerPanel', () => {
    const board = TestBlockFactory.createBoard()
    board.id = '1'
    board.rootId = '1'
    const activeView = TestBlockFactory.createBoardView(board)
    activeView.id = '1'
    const card1 = TestBlockFactory.createCard(board)
    card1.id = '1'
    card1.title = 'card1'
    card1.fields.properties = {id: 'property_value_id_1'}
    const card2 = TestBlockFactory.createCard(board)
    card2.id = '2'
    card2.title = 'card2'
    card2.fields.properties = {id: 'property_value_id_1'}
    const comment1 = TestBlockFactory.createComment(card1)
    comment1.id = '1'
    const comment2 = TestBlockFactory.createComment(card2)
    comment2.id = '2'
    const groupProperty: IPropertyTemplate = {
        id: 'id',
        name: 'name',
        type: 'text',
        options: [
            {
                color: 'propColorOrange',
                id: 'property_value_id_1',
                value: 'Q1',
            },
            {
                color: 'propColorBlue',
                id: 'property_value_id_2',
                value: 'Q2',
            },
        ],
    }
    const state = {
        clientConfig: {
            value: {
                featureFlags: {
                    subscriptions: true,
                },
            },
        },
        searchText: '',
        users: {
            me: {},
            workspaceUsers: [
                {username: 'username_1'},
            ],
            blockSubscriptions: [],
        },
        boards: {
            current: board.id,
        },
        cards: {
            templates: [card1, card2],
            cards: [card1, card2],
        },
        views: {
            views: {
                boardView: activeView,
            },
            current: 'boardView',
        },
        contents: {},
        comments: {
            comments: [comment1, comment2],
        },
    }
    const store = mockStateStore([], state)
    beforeAll(() => {
        mockDOM()
        console.error = jest.fn()
    })
    beforeEach(() => {
        activeView.fields.viewType = 'board'
        jest.clearAllMocks()
    })
    test('should match snapshot for Kanban', () => {
        const {container} = render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <CenterPanel
                    cards={[card1]}
                    views={[activeView]}
                    board={board}
                    activeView={activeView}
                    readonly={false}
                    showCard={jest.fn()}
                    showShared={true}
                    groupByProperty={groupProperty}
                    shownCardId={card1.id}
                />
            </ReduxProvider>,
        ))
        expect(container).toMatchSnapshot()
    })
    test('should match snapshot for Gallery', () => {
        activeView.fields.viewType = 'gallery'
        const {container} = render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <CenterPanel
                    cards={[card1]}
                    views={[activeView]}
                    board={board}
                    activeView={activeView}
                    readonly={false}
                    showCard={jest.fn()}
                    showShared={true}
                    groupByProperty={groupProperty}
                    shownCardId={card1.id}
                />
            </ReduxProvider>,
        ))
        expect(container).toMatchSnapshot()
    })
    test('should match snapshot for Table', () => {
        activeView.fields.viewType = 'table'
        const {container} = render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <CenterPanel
                    cards={[card1]}
                    views={[activeView]}
                    board={board}
                    activeView={activeView}
                    readonly={false}
                    showCard={jest.fn()}
                    showShared={true}
                    groupByProperty={groupProperty}
                    shownCardId={card1.id}
                />
            </ReduxProvider>,
        ))
        expect(container).toMatchSnapshot()
    })
    describe('return centerPanel and', () => {
        test('select one card and click background', () => {
            activeView.fields.viewType = 'table'
            const {container} = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <CenterPanel
                        cards={[card1, card2]}
                        views={[activeView]}
                        board={board}
                        activeView={activeView}
                        readonly={false}
                        showCard={jest.fn()}
                        showShared={true}
                        groupByProperty={groupProperty}
                        shownCardId={card1.id}
                    />
                </ReduxProvider>,
            ))

            //select card
            const cardElement = screen.getByRole('textbox', {name: 'card1'})
            expect(cardElement).not.toBeNull()
            userEvent.click(cardElement, {shiftKey: true})
            expect(container).toMatchSnapshot()

            //background
            const boardElement = container.querySelector('.BoardComponent')
            expect(boardElement).not.toBeNull()
            userEvent.click(boardElement!)
            expect(container).toMatchSnapshot()
        })

        test('press touch 1 with readonly', () => {
            activeView.fields.viewType = 'table'
            const {container, baseElement} = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <CenterPanel
                        cards={[card1, card2]}
                        views={[activeView]}
                        board={board}
                        activeView={activeView}
                        readonly={true}
                        showCard={jest.fn()}
                        showShared={true}
                        groupByProperty={groupProperty}
                        shownCardId={card1.id}
                    />
                </ReduxProvider>,
            ))

            //touch '1'
            fireEvent.keyDown(baseElement, {keyCode: 49})
            expect(container).toMatchSnapshot()
        })

        test('press touch esc for one card selected', () => {
            activeView.fields.viewType = 'table'
            const {container, baseElement} = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <CenterPanel
                        cards={[card1, card2]}
                        views={[activeView]}
                        board={board}
                        activeView={activeView}
                        readonly={false}
                        showCard={jest.fn()}
                        showShared={true}
                        groupByProperty={groupProperty}
                        shownCardId={card1.id}
                    />
                </ReduxProvider>,
            ))

            const cardElement = screen.getByRole('textbox', {name: 'card1'})
            expect(cardElement).not.toBeNull()
            userEvent.click(cardElement, {shiftKey: true})
            expect(container).toMatchSnapshot()

            //escape
            fireEvent.keyDown(baseElement, {keyCode: 27})
            expect(container).toMatchSnapshot()
        })
        test('press touch esc for two cards selected', async () => {
            activeView.fields.viewType = 'table'
            const {container, baseElement} = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <CenterPanel
                        cards={[card1, card2]}
                        views={[activeView]}
                        board={board}
                        activeView={activeView}
                        readonly={false}
                        showCard={jest.fn()}
                        showShared={true}
                        groupByProperty={groupProperty}
                        shownCardId={card1.id}
                    />
                </ReduxProvider>,
            ))

            //select card1
            const card1Element = screen.getByRole('textbox', {name: 'card1'})
            expect(card1Element).not.toBeNull()
            userEvent.click(card1Element, {shiftKey: true})
            expect(container).toMatchSnapshot()

            //select card2
            const card2Element = screen.getByRole('textbox', {name: 'card2'})
            expect(card2Element).not.toBeNull()
            userEvent.click(card2Element, {shiftKey: true, ctrlKey: true})
            expect(container).toMatchSnapshot()

            //escape
            fireEvent.keyDown(baseElement, {keyCode: 27})
            expect(container).toMatchSnapshot()
        })
        test('press touch del for one card selected', () => {
            activeView.fields.viewType = 'table'
            const {container, baseElement} = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <CenterPanel
                        cards={[card1, card2]}
                        views={[activeView]}
                        board={board}
                        activeView={activeView}
                        readonly={false}
                        showCard={jest.fn()}
                        showShared={true}
                        groupByProperty={groupProperty}
                        shownCardId={card1.id}
                    />
                </ReduxProvider>,
            ))
            const cardElement = screen.getByRole('textbox', {name: 'card1'})
            expect(cardElement).not.toBeNull()
            userEvent.click(cardElement, {shiftKey: true})
            expect(container).toMatchSnapshot()

            //delete
            fireEvent.keyDown(baseElement, {keyCode: 8})
            expect(mockedMutator.performAsUndoGroup).toBeCalledTimes(1)
        })
        test('press touch ctrl+d for one card selected', () => {
            activeView.fields.viewType = 'table'
            const {container, baseElement} = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <CenterPanel
                        cards={[card1, card2]}
                        views={[activeView]}
                        board={board}
                        activeView={activeView}
                        readonly={false}
                        showCard={jest.fn()}
                        showShared={true}
                        groupByProperty={groupProperty}
                        shownCardId={card1.id}
                    />
                </ReduxProvider>,
            ))
            const cardElement = screen.getByRole('textbox', {name: 'card1'})
            expect(cardElement).not.toBeNull()
            userEvent.click(cardElement, {shiftKey: true})
            expect(container).toMatchSnapshot()

            //ctrl+d
            fireEvent.keyDown(baseElement, {ctrlKey: true, keyCode: 68})
            expect(mockedMutator.performAsUndoGroup).toBeCalledTimes(1)
        })
        test('click on card to show card', () => {
            activeView.fields.viewType = 'board'
            const mockedShowCard = jest.fn()
            const {container} = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <CenterPanel
                        cards={[card1, card2]}
                        views={[activeView]}
                        board={board}
                        activeView={activeView}
                        readonly={false}
                        showCard={mockedShowCard}
                        showShared={true}
                        groupByProperty={groupProperty}
                        shownCardId={card1.id}
                    />
                </ReduxProvider>,
            ))

            const kanbanCardElements = container.querySelectorAll('.KanbanCard')
            expect(kanbanCardElements).not.toBeNull()
            const kanbanCardElement = kanbanCardElements[0]
            userEvent.click(kanbanCardElement)
            expect(container).toMatchSnapshot()
            expect(mockedShowCard).toBeCalledWith(card1.id)
        })
        test('click on new card to add card', () => {
            activeView.fields.viewType = 'table'
            const {container} = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <CenterPanel
                        cards={[card1, card2]}
                        views={[activeView]}
                        board={board}
                        activeView={activeView}
                        readonly={false}
                        showCard={jest.fn()}
                        showShared={true}
                        groupByProperty={groupProperty}
                        shownCardId={card1.id}
                    />
                </ReduxProvider>,
            ))
            const buttonWithMenuElement = container.querySelector('.ButtonWithMenu')
            expect(buttonWithMenuElement).not.toBeNull()
            userEvent.click(buttonWithMenuElement!)
            expect(mockedMutator.performAsUndoGroup).toBeCalledTimes(1)
        })
        test('click on new card to add card template', () => {
            activeView.fields.viewType = 'table'
            const {container} = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <CenterPanel
                        cards={[card1, card2]}
                        views={[activeView]}
                        board={board}
                        activeView={activeView}
                        readonly={false}
                        showCard={jest.fn()}
                        showShared={true}
                        groupByProperty={groupProperty}
                        shownCardId={card1.id}
                    />
                </ReduxProvider>,
            ))
            const elementMenuWrapper = container.querySelector('.ButtonWithMenu > div.MenuWrapper')
            expect(elementMenuWrapper).not.toBeNull()
            userEvent.click(elementMenuWrapper!)
            const buttonNewTemplate = within(elementMenuWrapper!.parentElement!).getByRole('button', {name: 'New template'})
            userEvent.click(buttonNewTemplate)
            expect(mockedMutator.insertBlock).toBeCalledTimes(1)
        })
        test('click on new card to add card from template', () => {
            activeView.fields.viewType = 'table'
            activeView.fields.defaultTemplateId = '1'
            const {container} = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <CenterPanel
                        cards={[card1, card2]}
                        views={[activeView]}
                        board={board}
                        activeView={activeView}
                        readonly={false}
                        showCard={jest.fn()}
                        showShared={true}
                        groupByProperty={groupProperty}
                        shownCardId={card1.id}
                    />
                </ReduxProvider>,
            ))
            const elementMenuWrapper = container.querySelector('.ButtonWithMenu > div.MenuWrapper')
            expect(elementMenuWrapper).not.toBeNull()
            userEvent.click(elementMenuWrapper!)
            const elementCard1 = within(elementMenuWrapper!.parentElement!).getByRole('button', {name: 'card1'})
            expect(elementCard1).not.toBeNull()
            userEvent.click(elementCard1)
            expect(mockedMutator.performAsUndoGroup).toBeCalledTimes(1)
        })
        test('click on new card to edit template', () => {
            activeView.fields.viewType = 'table'
            activeView.fields.defaultTemplateId = '1'
            const {container} = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <CenterPanel
                        cards={[card1, card2]}
                        views={[activeView]}
                        board={board}
                        activeView={activeView}
                        readonly={false}
                        showCard={jest.fn()}
                        showShared={true}
                        groupByProperty={groupProperty}
                        shownCardId={card1.id}
                    />
                </ReduxProvider>,
            ))
            const elementMenuWrapper = container.querySelector('.ButtonWithMenu > div.MenuWrapper')
            expect(elementMenuWrapper).not.toBeNull()
            userEvent.click(elementMenuWrapper!)
            const elementCard1 = within(elementMenuWrapper!.parentElement!).getByRole('button', {name: 'card1'})
            expect(elementCard1).not.toBeNull()
            const elementMenuWrapperCard1 = within(elementCard1).getByRole('button', {name: 'menuwrapper'})
            expect(elementMenuWrapperCard1).not.toBeNull()
            userEvent.click(elementMenuWrapperCard1)
            const elementEditMenuTemplate = within(elementMenuWrapperCard1).getByRole('button', {name: 'Edit'})
            expect(elementMenuWrapperCard1).not.toBeNull()
            userEvent.click(elementEditMenuTemplate)
            expect(container).toMatchSnapshot()
        })
    })
})
