'use client';

import { Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { fancyTrim } from '@packages/utils/strings';
import { useState } from 'react';

export function ProjectDescription({ description }: { description: string }) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  return (
    <Stack mt={2} data-test='project-details-description'>
      <Typography variant='body1'>{showFullDescription ? description : fancyTrim(description, 500)}</Typography>
      {description.length > 500 && (
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
      )}
    </Stack>
  );
}
