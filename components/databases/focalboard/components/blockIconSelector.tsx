// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback} from 'react'
import {useIntl} from 'react-intl'

import {BlockIcons} from '../blockIcons'
import {Board} from '../blocks/board'
import {Card} from '../blocks/card'
import mutator from '../mutator'
import EmojiPicker from '../widgets/emojiPicker'
import DeleteIcon from '../widgets/icons/delete'
import EmojiIcon from '../widgets/icons/emoji'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'
import './blockIconSelector.scss'

type Props = {
    block: Board|Card
    size?: 's' | 'm' | 'l'
    readonly?: boolean
}

const BlockIconSelector = React.memo((props: Props) => {
    const {block, size} = props
    const intl = useIntl()

    const onSelectEmoji = useCallback((emoji: string) => {
        mutator.changeIcon(block.id, block.fields.icon, emoji)
        document.body.click()
    }, [block.id, block.fields.icon])
    const onAddRandomIcon = useCallback(() => mutator.changeIcon(block.id, block.fields.icon, BlockIcons.shared.randomIcon()), [block.id, block.fields.icon])
    const onRemoveIcon = useCallback(() => mutator.changeIcon(block.id, block.fields.icon, '', 'remove icon'), [block.id, block.fields.icon])

    if (!block.fields.icon) {
        return null
    }

    let className = `octo-icon size-${size || 'm'}`
    if (props.readonly) {
        className += ' readonly'
    }
    const iconElement = <div className={className}><span>{block.fields.icon}</span></div>

    return (
        <div className='BlockIconSelector'>
            {props.readonly && iconElement}
            {!props.readonly &&
            <MenuWrapper>
                {iconElement}
                <Menu>
                    <Menu.Text
                        id='random'
                        icon={<EmojiIcon/>}
                        name={intl.formatMessage({id: 'ViewTitle.random-icon', defaultMessage: 'Random'})}
                        onClick={onAddRandomIcon}
                    />
                    <Menu.SubMenu
                        id='pick'
                        icon={<EmojiIcon/>}
                        name={intl.formatMessage({id: 'ViewTitle.pick-icon', defaultMessage: 'Pick icon'})}
                    >
                        <EmojiPicker onSelect={onSelectEmoji}/>
                    </Menu.SubMenu>
                    <Menu.Text
                        id='remove'
                        icon={<DeleteIcon/>}
                        name={intl.formatMessage({id: 'ViewTitle.remove-icon', defaultMessage: 'Remove icon'})}
                        onClick={onRemoveIcon}
                    />
                </Menu>
            </MenuWrapper>
            }
        </div>
    )
})

export default BlockIconSelector
