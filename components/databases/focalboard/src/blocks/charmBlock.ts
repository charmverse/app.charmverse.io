// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {ContentBlock} from './contentBlock'
import {Block, createBlock} from './block'

export type CharmTextBlock = ContentBlock & {
    type: 'charm_text'
}

function createCharmTextBlock(block?: Block): CharmTextBlock {
    return {
        ...createBlock(block),
        type: 'charm_text',
    }
}

export {createCharmTextBlock}
