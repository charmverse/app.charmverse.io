import React from 'react';

import { useDateFormatter } from 'hooks/useDateFormatter';

type Props = {
  updatedAt: string;
};

function LastModifiedAt(props: Props): JSX.Element {
  const { formatDateTime } = useDateFormatter();

  return <div className='LastModifiedAt octo-propertyvalue readonly'>{formatDateTime(new Date(props.updatedAt))}</div>;
}

export default LastModifiedAt;
