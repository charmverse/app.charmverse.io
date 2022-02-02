// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useCallback, useEffect, useRef} from 'react'
import {useIntl} from 'react-intl'

import {Board, IPropertyOption, IPropertyTemplate, PropertyType} from '../blocks/board'
import {Card} from '../blocks/card'
import {ContentBlock} from '../blocks/contentBlock'
import {CommentBlock} from '../blocks/commentBlock'
import mutator from '../mutator'
import {OctoUtils} from '../octoUtils'
import {Utils, IDType} from '../utils'
import Editable from '../widgets/editable'
import Switch from '../widgets/switch'

import UserProperty from './properties/user/user'
import MultiSelectProperty from './properties/multiSelect/multiSelect'
import URLProperty from './properties/link/link'
import LastModifiedBy from './properties/lastModifiedBy/lastModifiedBy'
import LastModifiedAt from './properties/lastModifiedAt/lastModifiedAt'
import CreatedAt from './properties/createdAt/createdAt'
import CreatedBy from './properties/createdBy/createdBy'
import DateRange from './properties/dateRange/dateRange'
import SelectProperty from './properties/select/select'

type Props = {
    board: Board
    readOnly: boolean
    card: Card
    contents: Array<ContentBlock|ContentBlock[]>
    comments: CommentBlock[]
    propertyTemplate: IPropertyTemplate
    showEmptyPlaceholder: boolean
}

const PropertyValueElement = (props:Props): JSX.Element => {
    const [value, setValue] = useState(props.card.fields.properties[props.propertyTemplate.id] || '')
    const [serverValue, setServerValue] = useState(props.card.fields.properties[props.propertyTemplate.id] || '')

    const {card, propertyTemplate, readOnly, showEmptyPlaceholder, board, contents, comments} = props
    const intl = useIntl()
    const propertyValue = card.fields.properties[propertyTemplate.id]
    const displayValue = OctoUtils.propertyDisplayValue(card, propertyValue, propertyTemplate, intl)
    const emptyDisplayValue = showEmptyPlaceholder ? intl.formatMessage({id: 'PropertyValueElement.empty', defaultMessage: 'Empty'}) : ''
    const finalDisplayValue = displayValue || emptyDisplayValue

    const editableFields: Array<PropertyType> = ['text', 'number', 'email', 'url', 'phone']

    const saveTextProperty = useCallback(() => {
        if (editableFields.includes(props.propertyTemplate.type)) {
            if (value !== (props.card.fields.properties[props.propertyTemplate.id] || '')) {
                mutator.changePropertyValue(card, propertyTemplate.id, value)
            }
        }
    }, [props.card, props.propertyTemplate, value])

    const saveTextPropertyRef = useRef<() => void>(saveTextProperty)
    saveTextPropertyRef.current = saveTextProperty

    useEffect(() => {
        if (serverValue === value) {
            setValue(props.card.fields.properties[props.propertyTemplate.id] || '')
        }
        setServerValue(props.card.fields.properties[props.propertyTemplate.id] || '')
    }, [value, props.card.fields.properties[props.propertyTemplate.id]])

    useEffect(() => {
        return () => {
            saveTextPropertyRef.current && saveTextPropertyRef.current()
        }
    }, [])

    const onDeleteValue = useCallback(() => mutator.changePropertyValue(card, propertyTemplate.id, ''), [card, propertyTemplate.id])

    const validateProp = (propType: string, val: string): boolean => {
        if (val === '') {
            return true
        }
        switch (propType) {
        case 'number':
            return !isNaN(parseInt(val, 10))
        case 'email': {
            const emailRegexp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            return emailRegexp.test(val)
        }
        case 'url': {
            const urlRegexp = /(((.+:(?:\/\/)?)?(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/
            return urlRegexp.test(val)
        }
        case 'text':
            return true
        case 'phone':
            return true
        default:
            return false
        }
    }

    if (propertyTemplate.type === 'multiSelect') {
        return (
            <MultiSelectProperty
                isEditable={!readOnly && Boolean(board)}
                emptyValue={emptyDisplayValue}
                propertyTemplate={propertyTemplate}
                propertyValue={propertyValue}
                onChange={(newValue) => mutator.changePropertyValue(card, propertyTemplate.id, newValue)}
                onChangeColor={(option: IPropertyOption, colorId: string) => mutator.changePropertyOptionColor(board, propertyTemplate, option, colorId)}
                onDeleteOption={(option: IPropertyOption) => mutator.deletePropertyOption(board, propertyTemplate, option)}
                onCreate={
                    async (newValue, currentValues) => {
                        const option: IPropertyOption = {
                            id: Utils.createGuid(IDType.BlockID),
                            value: newValue,
                            color: 'propColorDefault',
                        }
                        currentValues.push(option)
                        await mutator.insertPropertyOption(board, propertyTemplate, option, 'add property option')
                        mutator.changePropertyValue(card, propertyTemplate.id, currentValues.map((v) => v.id))
                    }
                }
                onDeleteValue={(valueToDelete, currentValues) => mutator.changePropertyValue(card, propertyTemplate.id, currentValues.filter((currentValue) => currentValue.id !== valueToDelete.id).map((currentValue) => currentValue.id))}
            />
        )
    }

    if (propertyTemplate.type === 'select') {
        return (
            <SelectProperty
                isEditable={!readOnly && Boolean(board)}
                emptyValue={emptyDisplayValue}
                propertyValue={propertyValue as string}
                propertyTemplate={propertyTemplate}
                onCreate={
                    async (newValue) => {
                        const option: IPropertyOption = {
                            id: Utils.createGuid(IDType.BlockID),
                            value: newValue,
                            color: 'propColorDefault',
                        }
                        await mutator.insertPropertyOption(board, propertyTemplate, option, 'add property option')
                        mutator.changePropertyValue(card, propertyTemplate.id, option.id)
                    }
                }
                onChange={(newValue) => {
                    mutator.changePropertyValue(card, propertyTemplate.id, newValue)
                }}
                onChangeColor={(option: IPropertyOption, colorId: string): void => {
                    mutator.changePropertyOptionColor(board, propertyTemplate, option, colorId)
                }}
                onDeleteOption={(option: IPropertyOption): void => {
                    mutator.deletePropertyOption(board, propertyTemplate, option)
                }}
                onDeleteValue={onDeleteValue}
            />
        )
    } else if (propertyTemplate.type === 'person') {
        return (
            <UserProperty
                value={propertyValue?.toString()}
                readonly={readOnly}
                onChange={(newValue) => mutator.changePropertyValue(card, propertyTemplate.id, newValue)}
            />
        )
    } else if (propertyTemplate.type === 'date') {
        if (readOnly) {
            return <div className='octo-propertyvalue'>{displayValue}</div>
        }
        return (
            <DateRange
                className='octo-propertyvalue'
                value={value.toString()}
                showEmptyPlaceholder={showEmptyPlaceholder}
                onChange={(newValue) => mutator.changePropertyValue(card, propertyTemplate.id, newValue)}
            />
        )
    } else if (propertyTemplate.type === 'url') {
        return (
            <URLProperty
                value={value.toString()}
                readonly={readOnly}
                placeholder={emptyDisplayValue}
                onChange={setValue}
                onSave={saveTextProperty}
                onCancel={() => setValue(propertyValue || '')}
                validator={(newValue) => validateProp(propertyTemplate.type, newValue)}
            />
        )
    } else if (propertyTemplate.type === 'checkbox') {
        return (
            <Switch
                isOn={Boolean(propertyValue)}
                onChanged={(newBool) => {
                    const newValue = newBool ? 'true' : ''
                    mutator.changePropertyValue(card, propertyTemplate.id, newValue)
                }}
                readOnly={readOnly}
            />
        )
    } else if (propertyTemplate.type === 'createdBy') {
        return (
            <CreatedBy userID={card.createdBy}/>
        )
    } else if (propertyTemplate.type === 'updatedBy') {
        return (
            <LastModifiedBy
                card={card}
                board={board}
                contents={contents}
                comments={comments}
            />
        )
    } else if (propertyTemplate.type === 'createdTime') {
        return (
            <CreatedAt createAt={card.createAt}/>
        )
    } else if (propertyTemplate.type === 'updatedTime') {
        return (
            <LastModifiedAt
                card={card}
                contents={contents}
                comments={comments}
            />
        )
    }

    if (
        editableFields.includes(propertyTemplate.type)
    ) {
        if (!readOnly) {
            return (
                <Editable
                    className='octo-propertyvalue'
                    placeholderText={emptyDisplayValue}
                    value={value.toString()}
                    autoExpand={true}
                    onChange={setValue}
                    onSave={saveTextProperty}
                    onCancel={() => setValue(propertyValue || '')}
                    validator={(newValue) => validateProp(propertyTemplate.type, newValue)}
                    spellCheck={propertyTemplate.type === 'text'}
                />
            )
        }
        return <div className='octo-propertyvalue octo-propertyvalue--readonly'>{displayValue}</div>
    }
    return <div className='octo-propertyvalue'>{finalDisplayValue}</div>
}

export default PropertyValueElement
