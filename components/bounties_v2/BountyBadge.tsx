import LaunchIcon from '@mui/icons-material/Launch';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { Bounty } from '@prisma/client';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { BOUNTY_LABELS } from 'models/Bounty';
import { CryptoCurrency, CryptoLogoPaths } from 'models/Currency';
import Image from 'next/image';
import Link from 'next/link';
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
  const radius = '10px';

  const bountyLink = `/${space!.domain}/bounty/${bounty.id}`;

  return (
    <Box sx={{ maxWidth: '250px', background: 'background', borderRadius: radius }}>
      <Container sx={{ display: 'flex', alignItems: 'center', verticalAlign: 'middle' }}>

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
