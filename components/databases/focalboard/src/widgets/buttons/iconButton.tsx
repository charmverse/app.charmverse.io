// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import './iconButton.scss'

type Props = {
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
    title?: string
    icon?: React.ReactNode
    className?: string
    onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

function IconButton(props: Props): JSX.Element {
    let className = 'Button IconButton'
    if (props.className) {
        className += ' ' + props.className
    }
    return (
        <button
            type='button'
            onClick={props.onClick}
            onMouseDown={props.onMouseDown}
            className={className}
            title={props.title}
            aria-label={props.title}
        >
            {props.icon}
        </button>
    )
}

export default React.memo(IconButton)
