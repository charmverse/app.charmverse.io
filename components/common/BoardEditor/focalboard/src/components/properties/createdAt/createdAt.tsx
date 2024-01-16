import { Box } from '@mui/material';
import React from 'react';

import { useDateFormatter } from 'hooks/useDateFormatter';

type Props = {
  createdAt: number;
};

function CreatedAt(props: Props): JSX.Element {
  const { formatDateTime } = useDateFormatter();
  return (
    <Box display='flex' alignItems='center' height='100%' className='octo-propertyvalue readonly'>
      {formatDateTime(new Date(props.createdAt))}
    </Box>
  );
}

export default CreatedAt;
