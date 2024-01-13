import styled from '@emotion/styled';
import { Box } from '@mui/material';
import React from 'react';

import { useDateFormatter } from 'hooks/useDateFormatter';

type Props = {
  updatedAt: string;
};

function LastModifiedAt(props: Props): JSX.Element {
  const { formatDateTime } = useDateFormatter();

  return (
    <Box display='flex' alignItems='center' height='100%' className='octo-propertyvalue readonly'>
      {formatDateTime(new Date(props.updatedAt))}
    </Box>
  );
}

export default LastModifiedAt;
