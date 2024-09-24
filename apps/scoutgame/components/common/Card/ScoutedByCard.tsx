import { Card, CardContent, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import { Avatar } from '../Avatar';

export function ScoutedByCard(props: any) {
  return (
    <Card>
      <CardContent
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 1,
          px: 0.5,
          py: 1
        }}
      >
        <Avatar
          src='https://s3.amazonaws.com/charm.public.staging/user-content/8647ddf3-bdc7-4787-bb12-1a1b67f73a3e/98c21c61-248e-4181-baf3-3f85a6243cd2/268290ab0cf8d1c878d6d9329103942b.jpg'
          name='John Doe'
          size='large'
        />
        <Typography>John Doe</Typography>
        <Typography variant='body2'>@john</Typography>
        <Stack flexDirection='row' alignItems='center' gap={0.5}>
          <Typography component='span' color='orange.main'>
            4
          </Typography>
          <Image src='/images/profile/icons/nft-orange-icon.svg' width='15' height='15' alt='nfts' />
        </Stack>
      </CardContent>
    </Card>
  );
}
