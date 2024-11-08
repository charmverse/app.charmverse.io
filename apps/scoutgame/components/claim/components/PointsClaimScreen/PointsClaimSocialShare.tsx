import { Typography, Stack, IconButton } from '@mui/material';
import Image from 'next/image';

export function PointsClaimSocialShare() {
  return (
    <Stack
      sx={{
        justifyContent: 'center',
        p: 2,
        alignItems: 'center',
        backgroundColor: '#D8E1FF'
      }}
    >
      <Typography variant='h6' color='#000' fontWeight='bold'>
        Share your win!
      </Typography>
      <Stack flexDirection='row' justifyContent='center'>
        <IconButton>
          <Image src='/images/logos/x.png' alt='X' width={42.5} height={42.5} />
        </IconButton>
        <IconButton>
          <Image src='/images/logos/telegram.png' alt='Telegram' width={42.5} height={42.5} />
        </IconButton>
        <IconButton>
          <Image src='/images/logos/warpcast.png' alt='Warpcast' width={42.5} height={42.5} />
        </IconButton>
      </Stack>
    </Stack>
  );
}
