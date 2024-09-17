import { Box, Stack, Typography } from '@mui/material';
import Image from 'next/image';

export function UserCardDetails({
  avatar,
  gems,
  scouts,
  likes
}: {
  avatar: string | null;
  gems: string | number;
  scouts: string | number;
  likes: string | number;
}) {
  return (
    <Stack flexDirection='row' alignItems='center' justifyContent='space-between' gap={1}>
      <Stack flexDirection='row' gap={1} alignItems='center'>
        <Typography variant='body2' component='span' color='text.secondary'>
          {gems}
        </Typography>
        <Image width={15} height={15} src='/images/profile/icons/hex-gem-icon.svg' alt='Gem' />
      </Stack>
      <Stack flexDirection='row' gap={1} alignItems='center'>
        <Typography variant='body2' component='span' color='text.secondary'>
          {scouts}
        </Typography>
        <Image width={15} height={15} src='/images/profile/icons/scout-icon.svg' alt='Scouts' />
      </Stack>
      <Stack flexDirection='row' gap={1} alignItems='flex-start'>
        <Typography variant='body2' component='span' color='text.secondary'>
          {likes}
        </Typography>
        <Image width={15} height={15} src='/images/profile/icons/like-icon.svg' alt='Likes' />
      </Stack>
    </Stack>
  );
}
