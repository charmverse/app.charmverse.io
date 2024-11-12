'use client';

import { Paper, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import React from 'react';

import { Avatar } from 'components/common/Avatar';
import { useDynamicFontSize } from 'hooks/useDynamicFontSize';
import type { BasicUserInfo } from 'lib/users/interfaces';

export type ScoutInfo = BasicUserInfo & {
  displayName: string;
  nfts: number;
};

export function ScoutCard({ scout }: { scout: ScoutInfo }) {
  const { fontSize, spanRef } = useDynamicFontSize(scout.displayName, 8, 18);

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
      <Stack direction='row' gap={0.5} alignItems='center' justifyContent='space-between'>
        <Typography color='green.main'>{scout.nfts}</Typography>
        <Image width={20} height={20} src='/images/profile/icons/cards-green.svg' alt='Cards' />
      </Stack>
    </Paper>
  );
}
