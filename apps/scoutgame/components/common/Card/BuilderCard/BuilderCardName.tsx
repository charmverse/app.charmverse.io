'use client';

import { Typography } from '@mui/material';

import { useDynamicFontSize } from 'hooks/useDynamicFontSize';

export function BuilderCardName({ name, size }: { name: string; size: 'x-small' | 'small' | 'medium' | 'large' }) {
  const maxFontSize = size === 'medium' || size === 'large' ? 14 : 12;
  const minFontSize = size === 'medium' || size === 'large' ? 11.5 : 9.5;
  const { fontSize, spanRef } = useDynamicFontSize(name, minFontSize, maxFontSize);

  return (
    <Typography
      ref={spanRef}
      component='span'
      sx={{
        textAlign: 'center',
        fontSize
      }}
    >
      {name}
    </Typography>
  );
}
