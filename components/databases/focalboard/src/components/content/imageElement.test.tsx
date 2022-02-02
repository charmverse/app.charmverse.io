// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render} from '@testing-library/react'

import {act} from 'react-dom/test-utils'

import {mocked} from 'ts-jest/utils'

import {ImageBlock} from '../../blocks/imageBlock'

import {wrapIntl} from '../../testUtils'

import octoClient from '../../octoClient'

import ImageElement from './imageElement'

jest.mock('../../octoClient')
const mockedOcto = mocked(octoClient, true)
mockedOcto.getFileAsDataUrl.mockResolvedValue('test.jpg')

describe('components/content/ImageElement', () => {
    const defaultBlock: ImageBlock = {
        id: 'test-id',
        workspaceId: '',
        parentId: '',
        rootId: '1',
        modifiedBy: 'test-user-id',
        schema: 0,
        type: 'image',
        title: 'test-title',
        fields: {
            fileId: 'test.jpg',
        },
        createdBy: 'test-user-id',
        createAt: 0,
        updateAt: 0,
        deleteAt: 0,
    }

    test('should match snapshot', async () => {
        const component = wrapIntl(
            <ImageElement
                block={defaultBlock}
            />,
        )
        let imageContainer: Element | undefined
        await act(async () => {
            const {container} = render(component)
            imageContainer = container
        })
        expect(imageContainer).toMatchSnapshot()
    })
})
