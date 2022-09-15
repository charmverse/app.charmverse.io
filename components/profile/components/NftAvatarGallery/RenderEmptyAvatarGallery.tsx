import React from 'react';
import { Typography, Box } from '@mui/material';

type Props = {
  emptyMessage?: string;
};

function EmptyAvatarGallery ({ emptyMessage }: Props) {
  return emptyMessage ? (
    <Box p={4} textAlign='center' flex={1}>
      <Typography>{emptyMessage}</Typography>
    </Box>
  ) : null;
}

export default EmptyAvatarGallery;
