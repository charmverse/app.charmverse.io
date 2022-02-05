// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {render} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {TestBlockFactory} from '../../test/testBlockFactory'
import {wrapIntl} from '../../testUtils'

import {TableCalculationOptions} from '../table/calculation/tableCalculationOptions'

import Calculation from './calculation'

describe('components/calculations/Calculation', () => {
    const board = TestBlockFactory.createBoard()

    const card = TestBlockFactory.createCard(board)
    card.fields.properties.property_2 = 'Foo'
    card.fields.properties.property_3 = 'Bar'
    card.fields.properties.property_4 = 'Baz'

    const card2 = TestBlockFactory.createCard(board)
    card2.fields.properties.property_2 = 'Lorem'
    card2.fields.properties.property_3 = ''
    card2.fields.properties.property_4 = 'Baz'

    test('should match snapshot - none', () => {
        const component = wrapIntl(
            <Calculation
                style={{}}
                class={'fooClass'}
                value={'none'}
                menuOpen={false}
                onMenuClose={() => {}}
                onMenuOpen={() => {}}
                onChange={() => {}}
                cards={[card, card2]}
                hovered={true}
                property={{
                    id: 'property_2',
                    name: '',
                    type: 'text',
                    options: [],
                }}
                optionsComponent={TableCalculationOptions}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot - count', () => {
        const component = wrapIntl(
            <Calculation
                style={{}}
                class={'fooClass'}
                value={'count'}
                menuOpen={false}
                onMenuClose={() => {}}
                onMenuOpen={() => {}}
                onChange={() => {}}
                cards={[card, card2]}
                hovered={true}
                property={{
                    id: 'property_2',
                    name: '',
                    type: 'text',
                    options: [],
                }}
                optionsComponent={TableCalculationOptions}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot - countValue', () => {
        const component = wrapIntl(
            <Calculation
                style={{}}
                class={'fooClass'}
                value={'countValue'}
                menuOpen={false}
                onMenuClose={() => {}}
                onMenuOpen={() => {}}
                onChange={() => {}}
                cards={[card, card2]}
                hovered={true}
                property={{
                    id: 'property_3',
                    name: '',
                    type: 'text',
                    options: [],
                }}
                optionsComponent={TableCalculationOptions}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot - countUniqueValue', () => {
        const component = wrapIntl(
            <Calculation
                style={{}}
                class={'fooClass'}
                value={'countUniqueValue'}
                menuOpen={false}
                onMenuClose={() => {}}
                onMenuOpen={() => {}}
                onChange={() => {}}
                cards={[card, card2]}
                hovered={true}
                property={{
                    id: 'property_4',
                    name: '',
                    type: 'text',
                    options: [],
                }}
                optionsComponent={TableCalculationOptions}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot - option change', () => {
        const onMenuOpen = jest.fn()
        const onMenuClose = jest.fn()
        const onChange = jest.fn()

        const component = wrapIntl(
            <Calculation
                style={{}}
                class={'fooClass'}
                value={'none'}
                menuOpen={true}
                onMenuClose={onMenuClose}
                onMenuOpen={onMenuOpen}
                onChange={onChange}
                cards={[card, card2]}
                hovered={true}
                property={{
                    id: 'property_2',
                    name: '',
                    type: 'text',
                    options: [],
                }}
                optionsComponent={TableCalculationOptions}
            />,
        )

        const {container} = render(component)
        const countMenuOption = container.querySelector('#react-select-2-option-1')
        userEvent.click(countMenuOption as Element)
        expect(container).toMatchSnapshot()
        expect(onMenuOpen).not.toBeCalled()
        expect(onMenuClose).toBeCalled()
        expect(onChange).toBeCalled()
    })
})
