import React from 'react';

import { useDateFormatter } from 'hooks/useDateFormatter';

type Props = {
  createdAt: number;
};

function CreatedAt(props: Props): JSX.Element {
  const { formatDateTime } = useDateFormatter();
  return <div className='CreatedAt octo-propertyvalue readonly'>{formatDateTime(new Date(props.createdAt))}</div>;
}

export default CreatedAt;
