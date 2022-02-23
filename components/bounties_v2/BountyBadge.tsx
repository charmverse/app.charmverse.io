import { useTheme } from '@emotion/react';
import LaunchIcon from '@mui/icons-material/Launch';
import { IconButton, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { grey } from '@mui/material/colors';
import Container from '@mui/material/Container';
import { Bounty } from '@prisma/client';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { BOUNTY_LABELS } from 'models/Bounty';
import { CryptoCurrency, CryptoLogoPaths } from 'models/Currency';
import Image from 'next/image';
import Link from 'next/link';
import { BountyStatusColours } from './BountyCard';

/**
 * @hideLink used in the Bounty page so we don't show a link when we are already on the page
 */

export interface IBountyBadgeProps {
  bounty: Bounty
  hideLink?: boolean
}

export function BountyBadge ({ bounty, hideLink = false } : IBountyBadgeProps) {
  const theme = useTheme();
  const [space] = useCurrentSpace();

  const bountyLink = `/${space!.domain}/bounty/${bounty.id}`;

  return (
    <Box sx={{ maxWidth: '400px', background: 'background', borderRadius: theme.spacing(1) }}>
      <Container sx={{ display: 'flex', alignItems: 'center', padding: theme.spacing(1) }}>
        <Box
          mr={0.75}
          component='span'
          sx={{
            width: 25,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Image
            loading='lazy'
            width={25}
            height={25}
            src={CryptoLogoPaths[bounty.rewardToken as CryptoCurrency]}
          />
        </Box>
        <Typography
          component='span'
          sx={{
            fontWeight: 600,
            color: grey[50]
          }}
          mr={0.5}
          variant='h6'
        >
          {bounty.rewardAmount}
        </Typography>
        <Box
          component='span'
          mr={2}
          sx={{
            position: 'relative',
            top: 2,
            fontSize: 12,
            color: grey[50]
          }}
        >
          {bounty.rewardToken}
        </Box>
        {
          hideLink === false && (
            <Link href={bountyLink} passHref={true}>
              <IconButton>
                <LaunchIcon sx={{
                  fill: grey[50]
                }}
                />
              </IconButton>
            </Link>
          )
        }

      </Container>
      <Container sx={{ padding: theme.spacing(1), background: BountyStatusColours[bounty.status], textAlign: 'center', fontWeight: 'bold' }}>
        <Typography
          component='span'
          sx={{
            textTransform: 'uppercase',
            fontWeight: 600,
            color: grey[50]
          }}
          variant='h6'
          px={1}
        >
          {BOUNTY_LABELS[bounty.status]}
        </Typography>
      </Container>
    </Box>
  );
}
