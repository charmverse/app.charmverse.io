import { Stack, Tooltip, Typography } from '@mui/material';
import Image from 'next/image';

import { PointsIcon } from 'components/common/Icons';

import { BuilderCardActivity } from './BuilderCardActivity/BuilderCardActivity';

export function BuilderCardStats({
  username,
  builderPoints,
  nftsSold,
  rank,
  last7DaysGems,
  size
}: {
  username: string;
  builderPoints?: number;
  nftsSold?: number;
  rank?: number;
  last7DaysGems?: number[];
  size: 'x-small' | 'small' | 'medium' | 'large';
}) {
  return (
    <Stack
      alignItems='center'
      pt={0.25}
      gap={{
        xs: 0,
        md: size === 'medium' || size === 'large' ? 0.25 : 0.1
      }}
      width='100%'
      height='100%'
    >
      <Typography
        component='span'
        sx={{
          fontSize: {
            xs: '11.5px',
            md: '14px'
          }
        }}
      >
        @{username}
      </Typography>
      <Stack flexDirection='row' width='100%' px={1} alignItems='center' justifyContent='space-between' gap={1}>
        {typeof builderPoints === 'number' && (
          <Tooltip title='Total # of Scout Points earned this season to date'>
            <Stack flexDirection='row' gap={0.25} alignItems='center'>
              <Typography
                sx={{
                  fontSize: {
                    xs: '12px',
                    md: '14px'
                  }
                }}
                component='span'
                color='green.main'
              >
                {builderPoints}
              </Typography>
              <PointsIcon size={16} color='green' />
            </Stack>
          </Tooltip>
        )}
        {typeof rank === 'number' && (
          <Tooltip title='Current week’s rank'>
            <Stack flexDirection='row' gap={0.2} alignItems='center'>
              <Typography
                sx={{
                  fontSize: {
                    xs: '12px',
                    md: '14px'
                  }
                }}
                component='span'
                color='text.secondary'
              >
                #{rank}
              </Typography>
            </Stack>
          </Tooltip>
        )}
        {typeof nftsSold === 'number' && (
          <Tooltip title='Total # of cards sold this season to date'>
            <Stack flexDirection='row' gap={0.25} alignItems='center'>
              <Typography
                sx={{
                  fontSize: {
                    xs: '12px',
                    md: '14px'
                  }
                }}
                component='span'
                color='orange.main'
              >
                {nftsSold}
              </Typography>
              <Image width={14} height={14} src='/images/profile/icons/nft-orange-icon.svg' alt='Nfts' />
            </Stack>
          </Tooltip>
        )}
      </Stack>
      <Stack flexDirection='row' gap={1} width='100%' px={1} alignItems='center'>
        <Stack sx={{ backgroundColor: 'text.secondary', height: '1px', flex: 1 }} />
        <Typography
          sx={{
            color: 'text.secondary',
            fontSize: {
              xs: '7.5px',
              md: '10px'
            }
          }}
        >
          7 DAY ACTIVITY
        </Typography>
        <Stack sx={{ backgroundColor: 'text.secondary', height: '1px', flex: 1 }} />
      </Stack>
      <BuilderCardActivity size={size} last7DaysGems={last7DaysGems ?? []} />
    </Stack>
  );
}
