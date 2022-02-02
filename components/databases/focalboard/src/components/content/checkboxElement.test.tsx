// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ReactElement, ReactNode} from 'react'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import '@testing-library/jest-dom'
import {mocked} from 'ts-jest/utils'
import userEvent from '@testing-library/user-event'

import {wrapIntl} from '../../testUtils'
import {ContentBlock, createContentBlock} from '../../blocks/contentBlock'
import {CardDetailContext, CardDetailContextType, CardDetailProvider} from '../cardDetail/cardDetailContext'
import {TestBlockFactory} from '../../test/testBlockFactory'
import mutator from '../../mutator'

import CheckboxElement from './checkboxElement'

jest.mock('../../mutator')
const mockedMutator = mocked(mutator, true)

const board = TestBlockFactory.createBoard()
const card = TestBlockFactory.createCard(board)
const checkboxBlock: ContentBlock = {
    id: 'test-id',
    workspaceId: '',
    parentId: card.id,
    rootId: card.rootId,
    modifiedBy: 'test-user-id',
    schema: 1,
    type: 'checkbox',
    title: 'test-title',
    fields: {value: false},
    createdBy: 'test-user-id',
    createAt: 0,
    updateAt: 0,
    deleteAt: 0,
}

const cardDetailContextValue = (autoAdded: boolean): CardDetailContextType => ({
    card,
    lastAddedBlock: {
        id: checkboxBlock.id,
        autoAdded,
    },
    deleteBlock: jest.fn(),
    addBlock: jest.fn(),
})

const wrap = (child: ReactNode): ReactElement => (
    wrapIntl(
        <CardDetailProvider card={card}>
            {child}
        </CardDetailProvider>,
    )
)

describe('components/content/checkboxElement', () => {
    beforeEach(jest.clearAllMocks)

    it('should match snapshot', () => {
        const component = wrap(
            <CheckboxElement
                block={checkboxBlock}
                readonly={false}
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    it('should match snapshot when read only', () => {
        const component = wrap(
            <CheckboxElement
                block={checkboxBlock}
                readonly={true}
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    it('should change title', () => {
        const {container} = render(wrap(
            <CheckboxElement
                block={checkboxBlock}
                readonly={false}
            />,
        ))
        const newTitle = 'new title'
        const input = screen.getByRole('textbox', {name: /test-title/i})
        userEvent.clear(input)
        userEvent.type(input, newTitle)
        fireEvent.blur(input)
        expect(container).toMatchSnapshot()
        expect(mockedMutator.updateBlock).toHaveBeenCalledTimes(1)
        expect(mockedMutator.updateBlock).toHaveBeenCalledWith(
            expect.objectContaining({title: newTitle}),
            checkboxBlock,
            expect.anything())
    })

    it('should toggle value', () => {
        const {container} = render(wrap(
            <CheckboxElement
                block={checkboxBlock}
                readonly={false}
            />,
        ))
        const input = screen.getByRole('checkbox')
        userEvent.click(input)
        expect(container).toMatchSnapshot()
        expect(mockedMutator.updateBlock).toHaveBeenCalledTimes(1)
        expect(mockedMutator.updateBlock).toHaveBeenCalledWith(
            expect.objectContaining({fields: {value: true}}),
            checkboxBlock,
            expect.anything())
    })

    it('should have focus when last added', () => {
        render(wrapIntl(
            <CardDetailContext.Provider value={cardDetailContextValue(false)}>
                <CheckboxElement
                    block={checkboxBlock}
                    readonly={false}
                />
            </CardDetailContext.Provider>,
        ))
        const input = screen.getByRole('textbox', {name: /test-title/i})
        expect(input).toHaveFocus()
    })

    it('should add new checkbox when enter pressed', async () => {
        const addElement = jest.fn()
        render(wrap(
            <CheckboxElement
                block={checkboxBlock}
                readonly={false}
                onAddElement={addElement}
            />,
        ))
        const input = screen.getByRole('textbox', {name: /test-title/i})

        // should not add new checkbox when current one has empty title
        userEvent.clear(input)
        userEvent.type(input, '{enter}')
        expect(addElement).toHaveBeenCalledTimes(0)

        // should add new checkbox when current one has non-empty title
        userEvent.clear(input)
        userEvent.type(input, 'new-title{enter}')
        await waitFor(() => expect(addElement).toHaveBeenCalledTimes(1))
    })

    it('should delete automatically added checkbox with empty title on esc/enter pressed', () => {
        const addedBlock = createContentBlock(checkboxBlock)
        addedBlock.title = ''
        const deleteElement = jest.fn()

        render(wrapIntl(
            <CardDetailContext.Provider value={cardDetailContextValue(true)}>
                <CheckboxElement
                    block={addedBlock}
                    readonly={false}
                    onDeleteElement={deleteElement}
                />
            </CardDetailContext.Provider>,
        ))

        const input = screen.getByRole('textbox')
        userEvent.type(input, '{esc}')
        expect(deleteElement).toHaveBeenCalledTimes(1)
        userEvent.type(input, '{enter}')
        expect(deleteElement).toHaveBeenCalledTimes(2)

        // should not delete if title is not empty
        userEvent.type(input, 'new-title{esc}')
        expect(deleteElement).toHaveBeenCalledTimes(2)
    })
})
