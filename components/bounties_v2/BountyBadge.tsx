import { Bounty } from '@prisma/client';
import styled from '@emotion/styled';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import LaunchIcon from '@mui/icons-material/Launch';
import Image from 'next/image';
import Link from 'next/link';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import { BOUNTY_LABELS } from 'models/Bounty';
import { CryptoLogoPaths, CryptoCurrency } from 'models/Currency';
import { BountyStatusColours } from './Bounty';

/**
 * @hideLink used in the Bounty page so we don't show a link when we are already on the page
 */
export interface IBountyBadgeProps {
  bounty: Bounty
  hideLink?: boolean
}

export function BountyBadge ({ bounty, hideLink = false } : IBountyBadgeProps) {

  const [space] = useCurrentSpace();

  const ContainerDiv = styled.div({ backgroundColor: 'green', borderRadius: '10px', display: 'block' });
  const RewardDiv = styled.div({ backgroundColor: 'Background', borderTopLeftRadius: '10px', borderTopRightRadius: '10px' });
  const StatusDiv = styled.div({ backgroundColor: BountyStatusColours[bounty.status], textAlign: 'center' });

  const radius = '10px';

  const bountyLink = `/${space!.domain}/bounty/${bounty.id}`;

  return (
    <Box sx={{ maxWidth: '400px', background: 'background', borderRadius: radius }}>
      <Container sx={{ display: 'block', verticalAlign: 'middle' }}>

        <Image
          loading='lazy'
          width='30px'
          height='30px'
          src={CryptoLogoPaths[bounty.rewardToken as CryptoCurrency]}
        />
        {' '}
        {' '}
        {bounty.rewardAmount}
        {' '}
        {bounty.rewardToken}
        {
          hideLink === false && (
            <Link href={bountyLink} passHref={true}>
              <LaunchIcon sx={{ float: 'right' }} />
            </Link>
          )
        }

      </Container>
      <Container sx={{ background: BountyStatusColours[bounty.status], textAlign: 'center', fontWeight: 'bold' }}>
        {BOUNTY_LABELS[bounty.status]}
        {' '}
        bounty
      </Container>
    </Box>
  );
}
