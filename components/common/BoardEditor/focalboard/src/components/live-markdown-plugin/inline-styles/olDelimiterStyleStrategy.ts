// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {InlineStrategy} from '../pluginStrategy'
import findRangesWithRegex from '../utils/findRangesWithRegex'

const createOLDelimiterStyleStrategy = (): InlineStrategy => {
    const olDelimiterRegex = /^\d{1,3}\. /g

    return {
        style: 'OL-DELIMITER',
        findStyleRanges: (block) => {
            const text = block.getText()
            const olDelimiterRanges = findRangesWithRegex(text, olDelimiterRegex)
            return olDelimiterRanges
        },
        styles: {
            fontWeight: 'bold',
        },
    }
}

export default createOLDelimiterStyleStrategy
