// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {Constants} from '../../constants'
import {IPropertyTemplate} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'
import mutator from '../../mutator'
import Button from '../../widgets/buttons/button'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'

type Props = {
    properties: readonly IPropertyTemplate[]
    activeView: BoardView
}
const ViewHeaderPropertiesMenu = React.memo((props: Props) => {
    const {properties, activeView} = props
    const intl = useIntl()
    const {viewType, visiblePropertyIds} = activeView.fields
    const canShowBadges = viewType === 'board' || viewType === 'gallery' || viewType === 'calendar'

    const toggleVisibility = (propertyId: string) => {
        let newVisiblePropertyIds = []
        if (visiblePropertyIds.includes(propertyId)) {
            newVisiblePropertyIds = visiblePropertyIds.filter((o: string) => o !== propertyId)
        } else {
            newVisiblePropertyIds = [...visiblePropertyIds, propertyId]
        }
        mutator.changeViewVisibleProperties(activeView.id, visiblePropertyIds, newVisiblePropertyIds)
    }

    return (
        <MenuWrapper label={intl.formatMessage({id: 'ViewHeader.properties-menu', defaultMessage: 'Properties menu'})}>
            <Button>
                <FormattedMessage
                    id='ViewHeader.properties'
                    defaultMessage='Properties'
                />
            </Button>
            <Menu>
                {activeView.fields.viewType === 'gallery' &&
                    <Menu.Switch
                        key={Constants.titleColumnId}
                        id={Constants.titleColumnId}
                        name={intl.formatMessage({id: 'default-properties.title', defaultMessage: 'Title'})}
                        isOn={visiblePropertyIds.includes(Constants.titleColumnId)}
                        onClick={toggleVisibility}
                    />}
                {properties?.map((option: IPropertyTemplate) => (
                    <Menu.Switch
                        key={option.id}
                        id={option.id}
                        name={option.name}
                        isOn={visiblePropertyIds.includes(option.id)}
                        onClick={toggleVisibility}
                    />
                ))}
                {canShowBadges &&
                    <Menu.Switch
                        key={Constants.badgesColumnId}
                        id={Constants.badgesColumnId}
                        name={intl.formatMessage({id: 'default-properties.badges', defaultMessage: 'Comments and Description'})}
                        isOn={visiblePropertyIds.includes(Constants.badgesColumnId)}
                        onClick={toggleVisibility}
                    />}
            </Menu>
        </MenuWrapper>
    )
})

export default ViewHeaderPropertiesMenu
