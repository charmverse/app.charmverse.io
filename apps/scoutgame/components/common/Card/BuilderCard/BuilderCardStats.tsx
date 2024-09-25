import { Stack, Typography } from '@mui/material';
import Image from 'next/image';

export function BuilderCardStats({
  gemsCollected,
  builderPoints,
  scoutedBy,
  nftsSold
}: {
  gemsCollected?: number;
  builderPoints?: number;
  scoutedBy?: number;
  nftsSold?: number;
}) {
  return (
    <Stack flexDirection='row' alignItems='center' justifyContent='space-between' gap={1}>
      {typeof gemsCollected === 'number' && (
        <Stack flexDirection='row' gap={0.2} alignItems='center'>
          <Typography variant='body2' component='span' color='text.secondary'>
            {gemsCollected}
          </Typography>
          <Image width={15} height={15} src='/images/profile/icons/hex-gem-icon.svg' alt='Gem' />
        </Stack>
      )}
      {typeof builderPoints === 'number' && (
        <Stack flexDirection='row' gap={0.2} alignItems='center'>
          <Typography variant='body2' component='span' color='green.main'>
            {builderPoints}
          </Typography>
          <Image width={15} height={15} src='/images/profile/icons/scout-icon.svg' alt='Scouts' />
        </Stack>
      )}
      {typeof scoutedBy === 'number' && (
        <Stack flexDirection='row' gap={0.2} alignItems='center'>
          <Typography variant='body2' component='span' color='orange.main'>
            {scoutedBy}
          </Typography>
          <Image width={15} height={15} src='/images/profile/icons/like-icon.svg' alt='Likes' />
        </Stack>
      )}
      {typeof nftsSold === 'number' && (
        <Stack flexDirection='row' gap={0.2} alignItems='center'>
          <Typography variant='body2' component='span' color='orange.main'>
            {nftsSold}
          </Typography>
          <Image width={12} height={12} src='/images/profile/icons/nft-orange-icon.svg' alt='Nfts' />
        </Stack>
      )}
    </Stack>
  );
}
