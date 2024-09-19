import { Stack, Typography } from '@mui/material';
import Image from 'next/image';

export function UserCardDetails({
  gems,
  scouts,
  likes,
  nfts
}: {
  gems?: number;
  scouts?: number;
  likes?: number;
  nfts?: number;
}) {
  return (
    <Stack flexDirection='row' alignItems='center' justifyContent='space-between' gap={1}>
      {typeof gems === 'number' && (
        <Stack flexDirection='row' gap={0.2} alignItems='center'>
          <Typography variant='body2' component='span' color='text.secondary'>
            {gems}
          </Typography>
          <Image width={15} height={15} src='/images/profile/icons/hex-gem-icon.svg' alt='Gem' />
        </Stack>
      )}
      {typeof scouts === 'number' && (
        <Stack flexDirection='row' gap={0.2} alignItems='center'>
          <Typography variant='body2' component='span' color='text.secondary'>
            {scouts}
          </Typography>
          <Image width={15} height={15} src='/images/profile/icons/scout-icon.svg' alt='Scouts' />
        </Stack>
      )}
      {typeof likes === 'number' && (
        <Stack flexDirection='row' gap={0.2} alignItems='center'>
          <Typography variant='body2' component='span' color='text.secondary'>
            {likes}
          </Typography>
          <Image width={15} height={15} src='/images/profile/icons/like-icon.svg' alt='Likes' />
        </Stack>
      )}
      {typeof nfts === 'number' && (
        <Stack flexDirection='row' gap={0.2} alignItems='center'>
          <Typography variant='body2' component='span' color='orange.main'>
            {nfts}
          </Typography>
          <Image width={12} height={12} src='/images/profile/icons/nft-orange-icon.svg' alt='Nfts' />
        </Stack>
      )}
    </Stack>
  );
}
