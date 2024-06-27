'use client';

import { Typography } from '@mui/material';
import { useState } from 'react';

import { fancyTrim } from 'lib/utils/strings';

export function ProjectDescription({ description }: { description: string }) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  return (
    <Typography
      variant='body1'
      mt={2}
      onClick={() => {
        setShowFullDescription(!showFullDescription);
      }}
    >
      {showFullDescription ? description : fancyTrim(description, 500)}
      <Typography
        variant='body2'
        sx={{
          mt: 1,
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        {showFullDescription ? 'Show less' : 'Show more'}
      </Typography>
    </Typography>
  );
}
