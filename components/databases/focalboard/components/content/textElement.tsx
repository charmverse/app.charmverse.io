// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {useIntl} from 'react-intl'

import {ContentBlock} from '../../blocks/contentBlock'
import {createTextBlock} from '../../blocks/textBlock'
import mutator from '../../mutator'
import TextIcon from '../../widgets/icons/text'
import {MarkdownEditor} from '../markdownEditor'

import {contentRegistry} from './contentRegistry'

type Props = {
    block: ContentBlock
    readonly: boolean
}

const TextElement = React.memo((props: Props): JSX.Element => {
    const {block, readonly} = props
    const intl = useIntl()

    return (
        <MarkdownEditor
            text={block.title}
            placeholderText={intl.formatMessage({id: 'ContentBlock.editText', defaultMessage: 'Edit text...'})}
            onBlur={(text) => {
                if (text !== block.title) {
                    mutator.changeTitle(block.id, block.title, text, intl.formatMessage({id: 'ContentBlock.editCardText', defaultMessage: 'edit card text'}))
                }
            }}
            readonly={readonly}
        />
    )
})

contentRegistry.registerContentType({
    type: 'text',
    getDisplayText: (intl) => intl.formatMessage({id: 'ContentBlock.text', defaultMessage: 'text'}),
    getIcon: () => <TextIcon/>,
    createBlock: async () => {
        return createTextBlock()
    },
    createComponent: (block, readonly) => {
        return (
            <TextElement
                block={block}
                readonly={readonly}
            />
        )
    },
})

export default TextElement
