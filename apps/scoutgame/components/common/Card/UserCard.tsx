'use client';

import type { Scout } from '@charmverse/core/prisma-client';
import { Box, Button, Card, CardActionArea, CardContent, CardMedia, Typography } from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';

import { NFTPurchaseDialog } from 'components/nft/NFTPurchaseDialog';
import type { TopBuilder } from 'lib/builders/getTopBuilders';

import { UserCardDetails } from './UserCardDetails';

export function UserCard({
  withDetails,
  user,
  scout
}: {
  withDetails: boolean;
  user: TopBuilder;
  scout?: Scout | null;
}) {
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);

  if (!user?.avatar) {
    return null;
  }

  return (
    <Card>
      <Box borderRadius='5px' overflow='hidden'>
        <CardActionArea
          LinkComponent={Link}
          href={`/u/${user.id}`}
          sx={{
            bgcolor: 'black.dark',
            borderStyle: 'solid',
            borderWidth: '4px',
            borderImage: 'linear-gradient(152.64deg, #69DDFF 2.2%, #85A5EA 48.95%, #A06CD5 95.71%) 1'
          }}
        >
          <Box position='relative'>
            <CardMedia component='img' height='190' image={user.avatar} alt={user.username} />
            <CardMedia
              component='img'
              height='190'
              image='/images/profile/scratch.png'
              alt={user.username}
              sx={{ position: 'absolute', top: 0, left: 0 }}
            />
            <CardMedia
              component='img'
              width='30px'
              height='30px'
              image='/images/profile/icons/blue-fire-icon.svg'
              alt='hot icon'
              sx={{ position: 'absolute', top: 10, right: 10, width: 'initial' }}
            />
            <CardMedia
              component='img'
              width='40px'
              height='40px'
              image='/images/profile/icons/season1-icon.svg'
              alt='hot icon'
              sx={{ position: 'absolute', top: 5, left: 5, width: 'initial' }}
            />
          </Box>
          <CardContent sx={{ p: 1 }}>
            <Typography gutterBottom variant='body1' textAlign='center'>
              {user.username}
            </Typography>
            {withDetails && (
              <UserCardDetails avatar={user.avatar} gems={user.gems} scouts={user.scouts} likes={user.likes} />
            )}
          </CardContent>
        </CardActionArea>
      </Box>
      <Box display='flex' justifyContent='center' pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }} px={{ xs: 2, md: 0 }}>
        <Button fullWidth LinkComponent={Link} variant='buy' onClick={scout ? () => setIsPurchasing(true) : undefined}>
          ${user.price}
        </Button>
      </Box>
      <NFTPurchaseDialog
        onClose={() => setIsPurchasing(false)}
        builderId={isPurchasing ? user.id : null}
        scout={scout}
      />
    </Card>
  );
}
