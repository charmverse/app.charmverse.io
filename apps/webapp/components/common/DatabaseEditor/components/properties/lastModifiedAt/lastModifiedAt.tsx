import { styled } from '@mui/material';
import { Box } from '@mui/material';
import React from 'react';

import { useDateFormatter } from 'hooks/useDateFormatter';

type Props = {
  updatedAt: string;
  wrapColumn?: boolean;
  centerContent?: boolean;
};

function LastModifiedAt(props: Props): JSX.Element {
  const { formatDateTime } = useDateFormatter();

  return (
    <Box
      display='flex'
      height='100%'
      className='octo-propertyvalue readonly'
      alignItems={props.centerContent ? 'center' : 'flex-start'}
      sx={{ whiteSpace: props.wrapColumn ? 'break-spaces' : 'nowrap' }}
    >
      {formatDateTime(new Date(props.updatedAt))}
    </Box>
  );
}

export default LastModifiedAt;
