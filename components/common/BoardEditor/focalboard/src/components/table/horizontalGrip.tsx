// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {useDrag} from 'react-dnd'


type Props = {
    templateId: string
    onAutoSizeColumn: (columnID: string) => void;
}

const HorizontalGrip = (props: Props): JSX.Element => {

    const [, drag] = useDrag(() => ({
        type: 'horizontalGrip',
        item: {id: props.templateId},
    }))

    return (
        <div
            ref={drag}
            className='HorizontalGrip'
            onDoubleClick={() => props.onAutoSizeColumn(props.templateId)}
        />
    )
};

export default React.memo(HorizontalGrip)
