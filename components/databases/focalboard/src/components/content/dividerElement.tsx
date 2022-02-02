// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {DividerBlock, createDividerBlock} from '../../blocks/dividerBlock'
import DividerIcon from '../../widgets/icons/divider'

import {contentRegistry} from './contentRegistry'
import './dividerElement.scss'

const DividerElement = React.memo((): JSX.Element => <div className='DividerElement'/>)

contentRegistry.registerContentType({
    type: 'divider',
    getDisplayText: (intl) => intl.formatMessage({id: 'ContentBlock.divider', defaultMessage: 'divider'}),
    getIcon: () => <DividerIcon/>,
    createBlock: async (): Promise<DividerBlock> => {
        return createDividerBlock()
    },
    createComponent: () => <DividerElement/>,
})

export default DividerElement
