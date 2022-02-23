import { PageLayout } from 'components/common/page-layout';
import { setTitle } from 'hooks/usePageTitle';
import { ReactElement, useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { BountyBadge } from 'components/bounties_v2/BountyBadge';

import charmClient from 'charmClient';
import { Bounty } from '@prisma/client';

export default function BountyDetails () {

  const [space] = useCurrentSpace();
  const [bounty, setBounty] = useState(null as any as Bounty);
  const router = useRouter();

  async function loadBounty () {
    const { bountyId } = router.query;
    const foundBounty = await charmClient.getBounty(bountyId as string);
    setBounty(foundBounty);
  }

  useEffect(() => {
    loadBounty();
  }, []);

  //  charmClient.getBounty();

  if (!space || !bounty) {
    return (
      <>
        Loading bounty
      </>
    );
  }

  return (
    <Grid container direction='column' justifyContent='space-between'>
      <Grid item xs={8}>
        <Typography variant='h1'>{bounty.title}</Typography>
      </Grid>
      <Grid item xs={4}>
        <BountyBadge bounty={bounty} hideLink={true} />
      </Grid>

    </Grid>
  );
}

BountyDetails.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
