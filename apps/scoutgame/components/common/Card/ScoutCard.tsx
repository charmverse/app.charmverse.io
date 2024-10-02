import { Paper, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import { Avatar } from 'components/common/Avatar';
import type { BasicUserInfo } from 'lib/users/interfaces';

export type ScoutInfo = BasicUserInfo & {
  nfts: number;
};

export function ScoutCard({ scout }: { scout: ScoutInfo }) {
  return (
    <Paper sx={{ p: 1, py: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
      <Avatar src={scout.avatar} variant='circular' size='large' />
      <Typography variant='h6' textAlign='center'>
        {scout.displayName}
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
