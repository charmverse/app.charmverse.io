'use client';

import { Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { useState } from 'react';

import { fancyTrim } from 'lib/utils/strings';

export function ProjectDescription({ description }: { description: string }) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  return (
    <Stack mt={2}>
      <Typography variant='body1'>{showFullDescription ? description : fancyTrim(description, 500)}</Typography>
      <Typography
        variant='body2'
        sx={{
          mt: 1,
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
        component='span'
        onClick={() => {
          setShowFullDescription(!showFullDescription);
        }}
      >
        {showFullDescription ? 'Show less' : 'Show more'}
      </Typography>
    </Stack>
  );
}
