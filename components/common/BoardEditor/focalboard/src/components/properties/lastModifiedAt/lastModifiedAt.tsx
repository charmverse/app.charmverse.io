
import React from 'react';
import { useIntl } from 'react-intl';

import { Block } from '../../../blocks/block';
import { Card } from '../../../blocks/card';
import { CommentBlock } from '../../../blocks/commentBlock';
import { ContentBlock } from '../../../blocks/contentBlock';
import { Utils } from '../../../utils';

type Props = {
    updatedAt: string;
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
