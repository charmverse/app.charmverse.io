// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import { useIntl } from 'react-intl';

import { Card } from '../../../blocks/card';
import { Block } from '../../../blocks/block';
import { ContentBlock } from '../../../blocks/contentBlock';
import { CommentBlock } from '../../../blocks/commentBlock';
import { Utils } from '../../../utils';

type Props = {
    updatedAt: string
}

function LastModifiedAt (props: Props): JSX.Element {
  const intl = useIntl();

  return (
    <div className='LastModifiedAt octo-propertyvalue readonly'>
      {Utils.displayDateTime(new Date(props.updatedAt), intl)}
    </div>
  );
}

export default LastModifiedAt;
