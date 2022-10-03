
import React from 'react';
import { useIntl } from 'react-intl';

import { Utils } from '../../../utils';

type Props = {
    createdAt: number;
}

function CreatedAt (props: Props): JSX.Element {
  const intl = useIntl();
  return (
    <div className='CreatedAt octo-propertyvalue readonly'>
      {Utils.displayDateTime(new Date(props.createdAt), intl)}
    </div>
  );
}

export default CreatedAt;
