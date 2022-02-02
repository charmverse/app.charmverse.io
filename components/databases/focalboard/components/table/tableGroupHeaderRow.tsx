// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React, {useState, useEffect} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {Constants} from '../../constants'
import {IPropertyOption, Board, IPropertyTemplate, BoardGroup} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'
import {useSortable} from '../../hooks/sortable'
import mutator from '../../mutator'
import Button from '../../widgets/buttons/button'
import IconButton from '../../widgets/buttons/iconButton'
import AddIcon from '../../widgets/icons/add'
import DeleteIcon from '../../widgets/icons/delete'
import DisclosureTriangle from '../../widgets/icons/disclosureTriangle'
import HideIcon from '../../widgets/icons/hide'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import Editable from '../../widgets/editable'
import Label from '../../widgets/label'

type Props = {
    board: Board
    activeView: BoardView
    group: BoardGroup
    groupByProperty?: IPropertyTemplate
    readonly: boolean
    hideGroup: (groupByOptionId: string) => void
    addCard: (groupByOptionId?: string) => Promise<void>
    propertyNameChanged: (option: IPropertyOption, text: string) => Promise<void>
    onDrop: (srcOption: IPropertyOption, dstOption?: IPropertyOption) => void
}

const TableGroupHeaderRow = React.memo((props: Props): JSX.Element => {
    const {board, activeView, group, groupByProperty} = props
    const [groupTitle, setGroupTitle] = useState(group.option.value)

    const [isDragging, isOver, groupHeaderRef] = useSortable('groupHeader', group.option, !props.readonly, props.onDrop)
    const intl = useIntl()

    useEffect(() => {
        setGroupTitle(group.option.value)
    }, [group.option.value])
    let className = 'octo-group-header-cell'
    if (isOver) {
        className += ' dragover'
    }
    if (activeView.fields.collapsedOptionIds.indexOf(group.option.id || 'undefined') < 0) {
        className += ' expanded'
    }

    const columnWidth = (templateId: string): number => {
        return Math.max(Constants.minColumnWidth, props.activeView.fields.columnWidths[templateId] || 0)
    }

    return (
        <div
            key={group.option.id + 'header'}
            ref={groupHeaderRef}
            style={{opacity: isDragging ? 0.5 : 1}}
            className={className}
        >
            <div
                className='octo-table-cell'
                style={{width: columnWidth(Constants.titleColumnId)}}
            >
                <IconButton
                    icon={<DisclosureTriangle/>}
                    onClick={() => (props.readonly ? {} : props.hideGroup(group.option.id || 'undefined'))}
                    className={props.readonly ? 'readonly' : ''}
                />

                {!group.option.id &&
                    <Label
                        title={intl.formatMessage({
                            id: 'BoardComponent.no-property-title',
                            defaultMessage: 'Items with an empty {property} property will go here. This column cannot be removed.',
                        }, {property: groupByProperty?.name})}
                    >
                        <FormattedMessage
                            id='BoardComponent.no-property'
                            defaultMessage='No {property}'
                            values={{
                                property: groupByProperty?.name,
                            }}
                        />
                    </Label>}
                {group.option.id &&
                    <Label color={group.option.color}>
                        <Editable
                            value={groupTitle}
                            placeholderText='New Select'
                            onChange={setGroupTitle}
                            onSave={() => {
                                if (groupTitle.trim() === '') {
                                    setGroupTitle(group.option.value)
                                }
                                props.propertyNameChanged(group.option, groupTitle)
                            }}
                            onCancel={() => {
                                setGroupTitle(group.option.value)
                            }}
                            readonly={props.readonly || !group.option.id}
                            spellCheck={true}
                        />
                    </Label>}
            </div>
            <Button>{`${group.cards.length}`}</Button>
            {!props.readonly &&
                <>
                    <MenuWrapper>
                        <IconButton icon={<OptionsIcon/>}/>
                        <Menu>
                            <Menu.Text
                                id='hide'
                                icon={<HideIcon/>}
                                name={intl.formatMessage({id: 'BoardComponent.hide', defaultMessage: 'Hide'})}
                                onClick={() => mutator.hideViewColumn(activeView, group.option.id || '')}
                            />
                            {group.option.id &&
                                <>
                                    <Menu.Text
                                        id='delete'
                                        icon={<DeleteIcon/>}
                                        name={intl.formatMessage({id: 'BoardComponent.delete', defaultMessage: 'Delete'})}
                                        onClick={() => mutator.deletePropertyOption(board, groupByProperty!, group.option)}
                                    />
                                    <Menu.Separator/>
                                    {Object.entries(Constants.menuColors).map(([key, color]) => (
                                        <Menu.Color
                                            key={key}
                                            id={key}
                                            name={color}
                                            onClick={() => mutator.changePropertyOptionColor(board, groupByProperty!, group.option, key)}
                                        />
                                    ))}
                                </>}
                        </Menu>
                    </MenuWrapper>
                    <IconButton
                        icon={<AddIcon/>}
                        onClick={() => props.addCard(group.option.id)}
                    />
                </>
            }
        </div>
    )
})

export default TableGroupHeaderRow
