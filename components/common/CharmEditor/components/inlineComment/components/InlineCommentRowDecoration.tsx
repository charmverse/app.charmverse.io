import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { CommentOutlined } from '@mui/icons-material';

export function RowDecoration ({ children }: { children: ReactNode; }) {
  return (
    <Box
      display='flex'
      gap={0.5}
      alignItems='center'
      sx={{ cursor: 'pointer' }}
    >
      {children}
    </Box>
  );
}

export default function RowIcon ({ count }: { count: number; }) {
  return (
    <RowDecoration>
      <CommentOutlined
        color='secondary'
        fontSize='small'
      />
      <Typography
        component='span'
        variant='subtitle1'
      >
        {count}
      </Typography>
    </RowDecoration>
  );
}
