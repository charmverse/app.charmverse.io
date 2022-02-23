import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import Typography from '@mui/material/Typography';
import { Bounty } from '@prisma/client';
import charmClient from 'charmClient';
import { BountyBadge } from 'components/bounties_v2/BountyBadge';
import { PageLayout } from 'components/common/page-layout';
import CharmEditor from 'components/editor/CharmEditor';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useRouter } from 'next/router';
import { ReactElement, useEffect, useState } from 'react';
import { BountyApplicantList } from 'components/bounties_v2/BountyApplicantList';

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
    <>
      <Grid container direction='column' justifyContent='space-between'>
        <Grid item xs={8}>
          <Typography variant='h1'>{bounty.title}</Typography>
        </Grid>
        <Grid item xs={4}>
          <BountyBadge bounty={bounty} hideLink={true} />
        </Grid>
        <Grid item xs={12}>
        </Grid>
      </Grid>

      <Box sx={{ my: '10px' }}>
        <Typography variant='h5'>Information</Typography>
        <CharmEditor content={bounty.descriptionNodes as any}></CharmEditor>
      </Box>

      <Grid container direction='column' display='block' justifyContent='space-between'>
        <Grid item xs={6}>
          <Typography variant='h5'>Reviewer</Typography>

          <Box sx={{ display: 'flex' }}>
            <Avatar></Avatar>
            {bounty.reviewer}
          </Box>

        </Grid>

        <Grid item xs={6}>
          <Typography variant='h5'>Assignee</Typography>
          {
            /*
            <Typography variant='h5'>Assignee</Typography>
          Content */
          }
          No assignee yet

        </Grid>
      </Grid>

      <BountyApplicantList bountyId='' />
    </>
  );
}

BountyDetails.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
