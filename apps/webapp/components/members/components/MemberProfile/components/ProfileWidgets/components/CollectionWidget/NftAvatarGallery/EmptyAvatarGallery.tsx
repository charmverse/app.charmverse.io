import { Typography, Box } from '@mui/material';
import React from 'react';

type Props = {
  emptyMessage?: string;
};

export function EmptyAvatarGallery({ emptyMessage }: Props) {
  return emptyMessage ? (
    <Box p={4} textAlign='center' flex={1}>
      <Typography>{emptyMessage}</Typography>
    </Box>
  ) : null;
}
