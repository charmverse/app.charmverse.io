// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {IPropertyTemplate} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'
import mutator from '../../mutator'
import Button from '../../widgets/buttons/button'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import CheckIcon from '../../widgets/icons/check'

type Props = {
    properties: readonly IPropertyTemplate[]
    activeView: BoardView
    groupByProperty?: IPropertyTemplate
}

const ViewHeaderGroupByMenu = React.memo((props: Props) => {
    const {properties, activeView, groupByProperty} = props
    const intl = useIntl()
    return (
        <MenuWrapper>
            <Button>
                <FormattedMessage
                    id='ViewHeader.group-by'
                    defaultMessage='Group by: {property}'
                    values={{
                        property: (
                            <span
                                style={{color: 'rgb(var(--center-channel-color-rgb))'}}
                                id='groupByLabel'
                            >
                                {groupByProperty?.name}
                            </span>
                        ),
                    }}
                />
            </Button>
            <Menu>
                {activeView.fields.viewType === 'table' && activeView.fields.groupById &&
                <>
                    <Menu.Text
                        key={'ungroup'}
                        id={''}
                        name={intl.formatMessage({id: 'GroupBy.ungroup', defaultMessage: 'Ungroup'})}
                        rightIcon={activeView.fields.groupById === '' ? <CheckIcon/> : undefined}
                        onClick={(id) => {
                            if (activeView.fields.groupById === id) {
                                return
                            }
                            mutator.changeViewGroupById(activeView.id, activeView.fields.groupById, id)
                        }}
                    />
                    <Menu.Separator/>
                </>}
                {properties?.filter((o: IPropertyTemplate) => o.type === 'select').map((option: IPropertyTemplate) => (
                    <Menu.Text
                        key={option.id}
                        id={option.id}
                        name={option.name}
                        rightIcon={groupByProperty?.id === option.id ? <CheckIcon/> : undefined}
                        onClick={(id) => {
                            if (activeView.fields.groupById === id) {
                                return
                            }

                            mutator.changeViewGroupById(activeView.id, activeView.fields.groupById, id)
                        }}
                    />
                ))}
            </Menu>
        </MenuWrapper>
    )
})

export default ViewHeaderGroupByMenu
