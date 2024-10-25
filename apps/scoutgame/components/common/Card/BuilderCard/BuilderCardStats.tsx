import { Stack, Tooltip, Typography } from '@mui/material';
import Image from 'next/image';

import { PointsIcon } from 'components/common/Icons';

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
  const gemHeight = size === 'x-small' ? 12 : size === 'small' ? 13.5 : size === 'medium' ? 14.5 : 16;

  return (
    <Stack
      alignItems='center'
      pt={0.25}
      gap={size === 'medium' || size === 'large' ? 0.25 : 0.1}
      width='100%'
      height='100%'
    >
      <Typography component='span' variant='body2'>
        @{username}
      </Typography>
      <Stack flexDirection='row' width='100%' px={1} alignItems='center' justifyContent='space-between' gap={1}>
        {typeof builderPoints === 'number' && (
          <Tooltip title='Total # of Scout Points earned this season to date'>
            <Stack flexDirection='row' gap={0.25} alignItems='center'>
              <Typography variant='body2' component='span' color='green.main'>
                {builderPoints}
              </Typography>
              <PointsIcon size={18} color='green' />
            </Stack>
          </Tooltip>
        )}
        {typeof rank === 'number' && (
          <Tooltip title='Current week’s rank'>
            <Stack flexDirection='row' gap={0.2} alignItems='center'>
              <Typography variant='body2' component='span' color='text.secondary'>
                #{rank}
              </Typography>
            </Stack>
          </Tooltip>
        )}
        {typeof nftsSold === 'number' && (
          <Tooltip title='Total # of cards sold this season to date'>
            <Stack flexDirection='row' gap={0.25} alignItems='center'>
              <Typography variant='body2' component='span' color='orange.main'>
                {nftsSold}
              </Typography>
              <Image width={14} height={14} src='/images/profile/icons/nft-orange-icon.svg' alt='Nfts' />
            </Stack>
          </Tooltip>
        )}
      </Stack>
      <Stack
        flexDirection='row'
        gap={1}
        width='100%'
        px={1}
        alignItems='center'
        display={{
          xs: 'none',
          md: 'flex'
        }}
      >
        <Stack sx={{ backgroundColor: 'text.secondary', height: '1px', flex: 1 }} />
        <Typography
          sx={{
            color: 'text.secondary',
            fontSize: '10px'
          }}
        >
          7 DAY ACTIVITY
        </Typography>
        <Stack sx={{ backgroundColor: 'text.secondary', height: '1px', flex: 1 }} />
      </Stack>
      <Stack flexDirection='row' gap={1.25} width='100%' height={gemHeight} px={1} mt={0.5} alignItems='center'>
        {last7DaysGems?.map((gem, index) => {
          const height = gem === 0 ? gemHeight * 0.25 : gem <= 29 ? gemHeight * 0.5 : gemHeight;

          return (
            <Stack
              key={`${index.toString()}-${gem}`}
              sx={{
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
              }}
            >
              <Stack
                sx={{
                  borderRadius: '50%',
                  width: height,
                  height,
                  backgroundColor: 'text.secondary'
                }}
              />
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}
