import 'server-only';

import { prisma } from '@charmverse/core/prisma-client';
import { Box, Paper, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { BuildersGallery } from 'components/builder/BuildersGallery';
import { BackButton } from 'components/common/Button/BackButton';
import { UserProfile } from 'components/common/Profile/UserProfile';
import { getScoutedBuilders } from 'lib/scouts/getScoutedBuilders';
import { getScoutStats } from 'lib/scouts/getScoutStats';

export async function PublicScoutProfile({ scoutId }: { scoutId: string }) {
  const scout = await prisma.scout.findUnique({
    where: {
      id: scoutId
    },
    select: {
      id: true,
      displayName: true,
      username: true,
      bio: true,
      avatar: true,
      githubUser: {
        select: {
          id: true,
          login: true
        }
      }
    }
  });

  if (!scout) {
    notFound();
  }

  const { allTimePoints, seasonPoints, nftsPurchased, buildersScouted } = await getScoutStats(scout.id);

  const scoutedBuilders = await getScoutedBuilders({ scoutId: scout.id });

  return (
    <Box>
      <Paper sx={{ py: 1 }}>
        <Stack flexDirection='row'>
          <BackButton />
          <UserProfile
            user={{
              id: scout.id,
              displayName: scout.displayName,
              username: scout.username,
              avatar: scout.avatar || '',
              bio: scout.bio,
              githubLogin: scout.githubUser[0]?.login
            }}
          />
        </Stack>
      </Paper>
      <Stack my={2}>
        <Stack>
          <Paper sx={{ p: 2 }}>
            <Typography paddingY={1} variant='subtitle1' textAlign='center' color='secondary'>
              THIS SEASON (ALL TIME)
            </Typography>
            <Stack flexDirection='row' justifyContent='space-between'>
              <Stack flexDirection='row' gap={1}>
                <Typography color='orange.main'>{seasonPoints}</Typography>
                <Image src='/images/profile/scout-game-orange-icon.svg' width='25' height='25' alt='scout game icon' />
                <Typography color='orange.main' variant='subtitle1'>
                  ({allTimePoints})
                </Typography>
              </Stack>
              <Typography color='orange.main'>{buildersScouted} Builders</Typography>
              <Stack flexDirection='row' gap={1}>
                <Typography color='orange.main'>{nftsPurchased}</Typography>
                <Image src='/images/profile/icons/nft-orange-icon.svg' width='25' height='25' alt='nft icon' />
                <Typography color='orange.main'>Held</Typography>
              </Stack>
            </Stack>
          </Paper>
          <Typography variant='subtitle1' my={1} color='secondary' fontWeight='500'>
            Scouted Builders
          </Typography>
          <BuildersGallery builders={scoutedBuilders} />
        </Stack>
      </Stack>
    </Box>
  );
}
