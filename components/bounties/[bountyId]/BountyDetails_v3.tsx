import Box from '@mui/material/Box';
import { useRouter } from 'next/router';
import charmClient from 'charmClient';
import { usePageTitle } from 'hooks/usePageTitle';
import { useEffect, useState } from 'react';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { BountyWithDetails } from 'models';
import BountyHeader from 'components/bounties/[bountyId]/components_v3/BountyHeader';
import { useBounties } from 'hooks/useBounties';

export default function BountyDetails () {

  const router = useRouter();
  const [_, setPageTitle] = usePageTitle();
  const { currentBounty } = useBounties();

  console.log('Rendering', !!currentBounty);

  if (!currentBounty) {
    return null;

    // return null;
  }

  return (
    <Box py={3} px='80px'>

      <Container top={20}>
        <BountyHeader />
      </Container>
    </Box>
  );

}

