// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';

import { createCard } from '../../../blocks/card';
import { IUser } from '../../../user';

import { createBoard } from '../../../blocks/board';

import { createCommentBlock } from '../../../blocks/commentBlock';

import LastModifiedBy from './lastModifiedBy';

describe('components/properties/lastModifiedBy', () => {
  test('should match snapshot', () => {

    const mockStore = configureStore([]);
    const store = mockStore({
      users: {
        workspaceUsers: {
          'user-id-1': { username: 'username_1' } as IUser
        }
      }
    });

    const component = (
      <ReduxProvider store={store}>
        <LastModifiedBy
          updatedBy='user-id-1'
        />
      </ReduxProvider>
    );

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });
});
