// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import Popper from '@mui/material/Popper'
import SeparatorOption from './separatorOption'
import SwitchOption from './switchOption'
import TextOption from './textOption'
import ColorOption from './colorOption'
import SubMenuOption from './subMenuOption'
import LabelOption from './labelOption'
import styled  from '@emotion/styled';


import { useMenuContext } from './menuContext'

type Props = {
    children: React.ReactNode
    position?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top' | 'bottom' | 'left' | 'right'
}

const StyledPopper = styled(Popper)`
    z-index: var(--z-index-modal);
`;

function Menu (props: Props) {

    const {position , children} = props
    const [anchorEl] = useMenuContext()

    return (
        <StyledPopper anchorEl={anchorEl} open={true} placement={position || 'bottom-start'}>
        <div className={'Menu noselect ' + (position || 'bottom-start')}>
            <div className='menu-contents'>
                <div className='menu-options'>
                    {children}
                </div>

                <div className='menu-spacer hideOnWidescreen'/>

                <div className='menu-options hideOnWidescreen'>
                    <Menu.Text
                        id='menu-cancel'
                        name={'Cancel'}
                        className='menu-cancel'
                        onClick={() => void 0}
                    />
                </div>
            </div>
         </div>
        </StyledPopper>
    )
}

Menu.Color = ColorOption
Menu.SubMenu = SubMenuOption
Menu.Switch = SwitchOption
Menu.Separator = SeparatorOption
Menu.Text = TextOption
Menu.Label = LabelOption

export default Menu