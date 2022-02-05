// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {useIntl} from 'react-intl'

import mutator from '../../mutator'
import {Card} from '../../blocks/card'
import IconButton from '../../widgets/buttons/iconButton'
import DeleteIcon from '../../widgets/icons/delete'
import EditIcon from '../../widgets/icons/edit'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import CheckIcon from '../../widgets/icons/check'
import {useAppSelector} from '../../store/hooks'
import {getCurrentView} from '../../store/views'

type Props = {
    cardTemplate: Card
    addCardFromTemplate: (cardTemplateId: string) => void
    editCardTemplate: (cardTemplateId: string) => void
}

const NewCardButtonTemplateItem = React.memo((props: Props) => {
    const currentView = useAppSelector(getCurrentView)
    const {cardTemplate} = props
    const intl = useIntl()
    const displayName = cardTemplate.title || intl.formatMessage({id: 'ViewHeader.untitled', defaultMessage: 'Untitled'})
    const isDefaultTemplate = currentView.fields.defaultTemplateId === cardTemplate.id

    return (
        <Menu.Text
            key={cardTemplate.id}
            id={cardTemplate.id}
            name={displayName}
            icon={<div className='Icon'>{cardTemplate.fields.icon}</div>}
            className={isDefaultTemplate ? 'bold-menu-text' : ''}
            onClick={() => {
                props.addCardFromTemplate(cardTemplate.id)
            }}
            rightIcon={
                <MenuWrapper stopPropagationOnToggle={true}>
                    <IconButton icon={<OptionsIcon/>}/>
                    <Menu position='left'>
                        <Menu.Text
                            icon={<CheckIcon/>}
                            id='default'
                            name={intl.formatMessage({id: 'ViewHeader.set-default-template', defaultMessage: 'Set as default'})}
                            onClick={async () => {
                                await mutator.setDefaultTemplate(currentView.id, currentView.fields.defaultTemplateId, cardTemplate.id)
                            }}
                        />
                        <Menu.Text
                            icon={<EditIcon/>}
                            id='edit'
                            name={intl.formatMessage({id: 'ViewHeader.edit-template', defaultMessage: 'Edit'})}
                            onClick={() => {
                                props.editCardTemplate(cardTemplate.id)
                            }}
                        />
                        <Menu.Text
                            icon={<DeleteIcon/>}
                            id='delete'
                            name={intl.formatMessage({id: 'ViewHeader.delete-template', defaultMessage: 'Delete'})}
                            onClick={async () => {
                                await mutator.performAsUndoGroup(async () => {
                                    if (currentView.fields.defaultTemplateId === cardTemplate.id) {
                                        await mutator.clearDefaultTemplate(currentView.id, currentView.fields.defaultTemplateId)
                                    }
                                    await mutator.deleteBlock(cardTemplate, 'delete card template')
                                })
                            }}
                        />
                    </Menu>
                </MenuWrapper>
            }
        />
    )
})

export default NewCardButtonTemplateItem
