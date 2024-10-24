import { Stack, Tooltip, Typography } from '@mui/material';
import Image from 'next/image';

import { PointsIcon } from 'components/common/Icons';

export function BuilderCardStats({
  builderPoints,
  nftsSold,
  rank
}: {
  builderPoints?: number;
  nftsSold?: number;
  rank?: number;
}) {
  return (
    <Stack flexDirection='row' alignItems='center' justifyContent='space-between' gap={1}>
      {typeof builderPoints === 'number' && (
        <Tooltip title='Total # of Scout Points earned this season to date'>
          <Stack flexDirection='row' gap={0.2} alignItems='center'>
            <Typography variant='body2' component='span' color='green.main'>
              {builderPoints}
            </Typography>
            <PointsIcon size={15} color='green' />
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
          <Stack flexDirection='row' gap={0.2} alignItems='center'>
            <Typography variant='body2' component='span' color='orange.main'>
              {nftsSold}
            </Typography>
            <Image width={12} height={12} src='/images/profile/icons/nft-orange-icon.svg' alt='Nfts' />
          </Stack>
        </Tooltip>
      )}
    </Stack>
  );
}
