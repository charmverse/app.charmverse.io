// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import Select, {components, IndicatorProps} from 'react-select'

import {CSSObject} from '@emotion/serialize'

import {useIntl, IntlShape} from 'react-intl'

import {getSelectBaseStyle} from '../../theme'
import ChevronUp from '../../widgets/icons/chevronUp'
import {IPropertyTemplate} from '../../blocks/board'

type Option = {
    label: string
    value: string
    displayName: string
}

export const Options:Record<string, Option> = {
    none: {value: 'none', label: 'None', displayName: 'Calculate'},
    count: {value: 'count', label: 'Count', displayName: 'Count'},
    countEmpty: {value: 'countEmpty', label: 'Count Empty', displayName: 'Empty'},
    countNotEmpty: {value: 'countNotEmpty', label: 'Count Not Empty', displayName: 'Not Empty'},
    percentEmpty: {value: 'percentEmpty', label: 'Percent Empty', displayName: 'Empty'},
    percentNotEmpty: {value: 'percentNotEmpty', label: 'Percent Not Empty', displayName: 'Not Empty'},
    countValue: {value: 'countValue', label: 'Count Value', displayName: 'Values'},
    countChecked: {value: 'countChecked', label: 'Count Checked', displayName: 'Checked'},
    percentChecked: {value: 'percentChecked', label: 'Percent Checked', displayName: 'Checked'},
    percentUnchecked: {value: 'percentUnchecked', label: 'Percent Unchecked', displayName: 'Unchecked'},
    countUnchecked: {value: 'countUnchecked', label: 'Count Unchecked', displayName: 'Unchecked'},
    countUniqueValue: {value: 'countUniqueValue', label: 'Count Unique Values', displayName: 'Unique'},
    sum: {value: 'sum', label: 'Sum', displayName: 'Sum'},
    average: {value: 'average', label: 'Average', displayName: 'Average'},
    median: {value: 'median', label: 'Median', displayName: 'Median'},
    min: {value: 'min', label: 'Min', displayName: 'Min'},
    max: {value: 'max', label: 'Max', displayName: 'Max'},
    range: {value: 'range', label: 'Range', displayName: 'Range'},
    earliest: {value: 'earliest', label: 'Earliest Date', displayName: 'Earliest'},
    latest: {value: 'latest', label: 'Latest Date', displayName: 'Latest'},
    dateRange: {value: 'dateRange', label: 'Date Range', displayName: 'Range'},
}

export const optionLabelString = (option: Option, intl: IntlShape): string => {
    switch (option.value) {
    case 'none': return intl.formatMessage({id: 'Calculations.Options.none.label', defaultMessage: 'None'})
    case 'count': return intl.formatMessage({id: 'Calculations.Options.count.label', defaultMessage: 'Count'})
    case 'countValue': return intl.formatMessage({id: 'Calculations.Options.countValue.label', defaultMessage: 'Count Value'})
    case 'countChecked': return intl.formatMessage({id: 'Calculations.Options.countChecked.label', defaultMessage: 'Count Checked'})
    case 'percentChecked': return intl.formatMessage({id: 'Calculations.Options.percentChecked.label', defaultMessage: 'Percent Checked'})
    case 'percentUnchecked': return intl.formatMessage({id: 'Calculations.Options.percentUnchecked.label', defaultMessage: 'Percent Unchecked'})
    case 'countUnchecked': return intl.formatMessage({id: 'Calculations.Options.countUnchecked.label', defaultMessage: 'Count Unchecked'})
    case 'countUniqueValue': return intl.formatMessage({id: 'Calculations.Options.countUniqueValue.label', defaultMessage: 'Count Unique Values'})
    case 'sum': return intl.formatMessage({id: 'Calculations.Options.sum.label', defaultMessage: 'Sum'})
    case 'average': return intl.formatMessage({id: 'Calculations.Options.average.label', defaultMessage: 'Average'})
    case 'median': return intl.formatMessage({id: 'Calculations.Options.median.label', defaultMessage: 'Median'})
    case 'min': return intl.formatMessage({id: 'Calculations.Options.min.label', defaultMessage: 'Min'})
    case 'max': return intl.formatMessage({id: 'Calculations.Options.max.label', defaultMessage: 'Max'})
    case 'range': return intl.formatMessage({id: 'Calculations.Options.range.label', defaultMessage: 'Range'})
    case 'earliest': return intl.formatMessage({id: 'Calculations.Options.earliest.label', defaultMessage: 'Earliest'})
    case 'latest': return intl.formatMessage({id: 'Calculations.Options.latest.label', defaultMessage: 'Latest'})
    case 'dateRange': return intl.formatMessage({id: 'Calculations.Options.dateRange.label', defaultMessage: 'Range'})
    default: return option.label
    }
}

export const optionDisplayNameString = (option: Option, intl: IntlShape): string => {
    switch (option.value) {
    case 'none': return intl.formatMessage({id: 'Calculations.Options.none.displayName', defaultMessage: 'Calculate'})
    case 'count': return intl.formatMessage({id: 'Calculations.Options.count.displayName', defaultMessage: 'Count'})
    case 'countValue': return intl.formatMessage({id: 'Calculations.Options.countValue.displayName', defaultMessage: 'Values'})
    case 'countChecked': return intl.formatMessage({id: 'Calculations.Options.countChecked.displayName', defaultMessage: 'Checked'})
    case 'percentChecked': return intl.formatMessage({id: 'Calculations.Options.percentChecked.displayName', defaultMessage: 'Checked'})
    case 'percentUnchecked': return intl.formatMessage({id: 'Calculations.Options.percentUnchecked.displayName', defaultMessage: 'Unchecked'})
    case 'countUnchecked': return intl.formatMessage({id: 'Calculations.Options.countUnchecked.displayName', defaultMessage: 'Unchecked'})
    case 'countUniqueValue': return intl.formatMessage({id: 'Calculations.Options.countUniqueValue.displayName', defaultMessage: 'Unique'})
    case 'sum': return intl.formatMessage({id: 'Calculations.Options.sum.displayName', defaultMessage: 'Sum'})
    case 'average': return intl.formatMessage({id: 'Calculations.Options.average.displayName', defaultMessage: 'Average'})
    case 'median': return intl.formatMessage({id: 'Calculations.Options.median.displayName', defaultMessage: 'Median'})
    case 'min': return intl.formatMessage({id: 'Calculations.Options.min.displayName', defaultMessage: 'Min'})
    case 'max': return intl.formatMessage({id: 'Calculations.Options.max.displayName', defaultMessage: 'Max'})
    case 'range': return intl.formatMessage({id: 'Calculations.Options.range.displayName', defaultMessage: 'Range'})
    case 'earliest': return intl.formatMessage({id: 'Calculations.Options.earliest.displayName', defaultMessage: 'Earliest'})
    case 'latest': return intl.formatMessage({id: 'Calculations.Options.latest.displayName', defaultMessage: 'Latest'})
    case 'dateRange': return intl.formatMessage({id: 'Calculations.Options.dateRange.displayName', defaultMessage: 'Range'})
    default: return option.displayName
    }
}

export const optionsByType: Map<string, Option[]> = new Map([
    ['common', [Options.none, Options.count, Options.countEmpty, Options.countNotEmpty, Options.percentEmpty,
        Options.percentNotEmpty, Options.countValue, Options.countUniqueValue]],
    ['checkbox', [Options.countChecked, Options.countUnchecked, Options.percentChecked, Options.percentUnchecked]],
    ['number', [Options.sum, Options.average, Options.median, Options.min, Options.max, Options.range]],
    ['date', [Options.earliest, Options.latest, Options.dateRange]],
    ['createdTime', [Options.earliest, Options.latest, Options.dateRange]],
    ['updatedTime', [Options.earliest, Options.latest, Options.dateRange]],
])

export const typesByOptions: Map<string, string[]> = generateTypesByOption()

function generateTypesByOption(): Map<string, string[]> {
    const mapping = new Map<string, string[]>()

    optionsByType.forEach((options, type) => {
        options.forEach((option) => {
            const types = mapping.get(option.value) || []
            types.push(type)
            mapping.set(option.value, types)
        })
    })

    return mapping
}

const baseStyles = getSelectBaseStyle()

const styles = {
    ...baseStyles,
    dropdownIndicator: (provided: CSSObject): CSSObject => ({
        ...baseStyles.dropdownIndicator(provided),
        pointerEvents: 'none',
    }),
    control: (): CSSObject => ({
        border: 0,
        width: '100%',
        margin: '0',
        display: 'flex',
        flexDirection: 'row',
    }),
    menu: (provided: CSSObject): CSSObject => ({
        ...provided,
        minWidth: '100%',
        width: 'max-content',
        background: 'rgb(var(--center-channel-bg-rgb))',
        left: '0',
        marginBottom: '0',
    }),
    singleValue: (provided: CSSObject): CSSObject => ({
        ...baseStyles.singleValue(provided),
        opacity: '0.8',
        fontSize: '12px',
        right: '0',
        textTransform: 'uppercase',
    }),
    valueContainer: (provided: CSSObject): CSSObject => ({
        ...baseStyles.valueContainer(provided),
        display: 'none',
        pointerEvents: 'none',
    }),
}

const DropdownIndicator = (props: IndicatorProps<Option, false>) => {
    return (
        <components.DropdownIndicator {...props}>
            <ChevronUp/>
        </components.DropdownIndicator>
    )
}

// Calculation option props shared by all implementations of calculation options
type CommonCalculationOptionProps = {
    value: string,
    menuOpen: boolean
    onClose?: () => void
    components?: {[key:string]: (props: any) => JSX.Element}
    onChange: (data: any) => void
    property?: IPropertyTemplate
}

// Props used by the base calculation option component
type BaseCalculationOptionProps = CommonCalculationOptionProps & {
    options: Option[]
}

const CalculationOptions = (props: BaseCalculationOptionProps): JSX.Element => {
    const intl = useIntl()

    return (
        <Select
            styles={styles}
            value={Options[props.value]}
            isMulti={false}
            isClearable={true}
            name={'calculation_options'}
            className={'CalculationOptions'}
            classNamePrefix={'CalculationOptions'}
            options={props.options}
            menuPlacement={'auto'}
            isSearchable={false}
            components={{DropdownIndicator, ...(props.components || {})}}
            defaultMenuIsOpen={props.menuOpen}
            autoFocus={true}
            formatOptionLabel={(option: Option, meta) => {
                return meta.context === 'menu' ? optionLabelString(option, intl) : optionDisplayNameString(option, intl)
            }}
            onMenuClose={() => {
                if (props.onClose) {
                    props.onClose()
                }
            }}
            onChange={(item) => {
                if (item?.value) {
                    props.onChange(item.value)
                }
            }}
        />
    )
}

export {
    CalculationOptions,
    Option,
    CommonCalculationOptionProps,
}
