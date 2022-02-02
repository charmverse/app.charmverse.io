// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {CSSProperties} from 'react'
import {useIntl} from 'react-intl'

import {Card} from '../../blocks/card'

import {IPropertyTemplate} from '../../blocks/board'

import ChevronUp from '../../widgets/icons/chevronUp'

import {CommonCalculationOptionProps, Options, optionDisplayNameString} from './options'

import Calculations from './calculations'
import './calculation.scss'

type Props = {
    style: CSSProperties
    class: string
    value: string
    menuOpen: boolean
    onMenuClose: () => void
    onMenuOpen: () => void
    onChange: (value: string) => void
    cards: readonly Card[]
    property: IPropertyTemplate
    hovered: boolean
    optionsComponent: React.ComponentType<CommonCalculationOptionProps>
}

const Calculation = (props: Props): JSX.Element => {
    const value = props.value || Options.none.value
    const valueOption = Options[value]
    const intl = useIntl()

    const option = (
        <props.optionsComponent
            value={value}
            menuOpen={props.menuOpen}
            onClose={props.onMenuClose}
            onChange={props.onChange}
            property={props.property}
        />
    )

    return (

        // tabindex is needed to make onBlur work on div.
        // See this for more details-
        // https://stackoverflow.com/questions/47308081/onblur-event-is-not-firing
        <div
            className={`Calculation ${value} ${props.class} ${props.menuOpen ? 'menuOpen' : ''} ${props.hovered ? 'hovered' : ''}`}
            style={props.style}
            onClick={() => (props.menuOpen ? props.onMenuClose() : props.onMenuOpen())}
            tabIndex={0}
            onBlur={props.onMenuClose}
        >
            {
                props.menuOpen && (
                    <div>
                        {option}
                    </div>
                )
            }

            <span className='calculationLabel'>
                {optionDisplayNameString(valueOption!, intl)}
            </span>

            {
                value === Options.none.value &&
                <ChevronUp/>
            }

            {
                value !== Options.none.value &&
                <span className='calculationValue'>
                    {Calculations[value] ? Calculations[value](props.cards, props.property, intl) : ''}
                </span>
            }

        </div>
    )
}

export default Calculation
