'use client';

import { Paper, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import React, { useRef, useState, useLayoutEffect } from 'react';

import { Avatar } from 'components/common/Avatar';
import type { BasicUserInfo } from 'lib/users/interfaces';

export type ScoutInfo = BasicUserInfo & {
  displayName: string;
  nfts: number;
};

function useDynamicFontSize(text: string, maxWidth: number, minFontSize: number, maxFontSize: number) {
  const [fontSize, setFontSize] = useState(maxFontSize);
  const spanRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const span = spanRef.current;
    if (!span) return;

    let currentFontSize = maxFontSize;
    span.style.fontSize = `${currentFontSize}px`;

    while (span.offsetWidth > maxWidth && currentFontSize > minFontSize) {
      currentFontSize -= 0.5;
      span.style.fontSize = `${currentFontSize}px`;
    }

    setFontSize(currentFontSize);
  }, [text, maxWidth, minFontSize, maxFontSize]);

  return { fontSize, spanRef };
}

export function ScoutCard({ scout }: { scout: ScoutInfo }) {
  const { fontSize, spanRef } = useDynamicFontSize(scout.displayName, 150, 8, 18);

  return (
    <Paper sx={{ p: 1, py: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
      <Avatar src={scout.avatar} variant='circular' size='large' />
      <Typography
        variant='h6'
        textAlign='center'
        sx={{
          fontSize: `${fontSize}px`,
          width: '100%',
          lineHeight: 1.2
        }}
      >
        <span ref={spanRef}>{scout.displayName}</span>
      </Typography>
      <Typography
        variant='body2'
        textAlign='center'
        textOverflow='ellipsis'
        overflow='hidden'
        width='100%'
        whiteSpace='nowrap'
      >
        {scout.username}
      </Typography>

      <Stack direction='row' gap={0.5} alignItems='center' justifyContent='space-between'>
        <Typography color='orange.main'>{scout.nfts}</Typography>
        <Image width={20} height={20} src='/images/profile/icons/nft-orange-icon.svg' alt='Nfts' />
      </Stack>
    </Paper>
  );
}
