import { useTheme } from '@emotion/react';
import LaunchIcon from '@mui/icons-material/Launch';
import { IconButton, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { grey } from '@mui/material/colors';
import { Bounty } from '@prisma/client';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import millify from 'millify';
import { BOUNTY_LABELS } from 'models/Bounty';
import { CryptoCurrency, CryptoLogoPaths } from 'models/Currency';
import Image from 'next/image';
import Link from 'next/link';
import { BountyStatusColours } from './BountyCard';

/**
 * @hideLink used in the Bounty page so we don't show a link when we are already on the page
 * @direction used for the layout of the bounty info and bounty status
 */

export interface IBountyBadgeProps {
  bounty: Bounty
  hideLink?: boolean,
  direction?: 'row' | 'column'
}

export function BountyBadge ({ bounty, direction = 'row', hideLink = false } : IBountyBadgeProps) {
  const [space] = useCurrentSpace();
  const theme = useTheme();

  const bountyLink = `/${space!.domain}/bounty/${bounty.id}`;

  const imageLogo = CryptoLogoPaths[bounty.rewardToken as CryptoCurrency];

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: direction
    }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          mr={0.75}
          component='span'
          sx={{
            width: 25,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {
            imageLogo !== undefined && (
              <Image
                loading='lazy'
                width={25}
                height={25}
                src={imageLogo}
              />
            )
          }
        </Box>
        <Typography
          component='span'
          sx={{
            fontWeight: 600
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
            opacity: 0.75
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
      </Box>
      <Box p={0.5} borderRadius={1} sx={{ background: theme.palette[BountyStatusColours[bounty.status]].main, textAlign: 'center', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography
          component='span'
          sx={{
            textTransform: 'uppercase',
            fontWeight: 600
          }}
          variant='body1'
          px={1}
        >
          {BOUNTY_LABELS[bounty.status]}
        </Typography>
      </Box>
    </Box>
  );
}
