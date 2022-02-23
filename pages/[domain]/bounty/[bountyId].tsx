import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import EditIcon from '@mui/icons-material/Edit';
import Table from '@mui/material/Table';
import Typography from '@mui/material/Typography';
import { Bounty } from '@prisma/client';
import charmClient from 'charmClient';
import { BountyBadge } from 'components/bounties_v2/BountyBadge';
import { PageLayout } from 'components/common/page-layout';
import BountyModal from 'components/bounties_v2/BountyModal';
import CharmEditor from 'components/editor/CharmEditor';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useRouter } from 'next/router';
import { ReactElement, useEffect, useState } from 'react';
import { BountyApplicantList } from 'components/bounties_v2/BountyApplicantList';

export default function BountyDetails () {

  const [space] = useCurrentSpace();
  const [bounty, setBounty] = useState(null as any as Bounty);
  const [showBountyEditDialog, setShowBountyEditDialog] = useState(false);
  const router = useRouter();

  async function loadBounty () {
    const { bountyId } = router.query;
    const foundBounty = await charmClient.getBounty(bountyId as string);
    setBounty(foundBounty);
  }

  function toggleDialog () {
    setShowBountyEditDialog(!showBountyEditDialog);
  }

  useEffect(() => {
    loadBounty();
  }, []);

  const viewerCanModifyBounty: boolean = true;

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

      <BountyModal onSubmit={loadBounty} mode='update' bounty={bounty} open={showBountyEditDialog} onClose={toggleDialog} />

      <Grid container direction='column' justifyContent='space-between'>
        <Grid item xs={8}>
          <Typography variant='h1'>
            <Box component='span' px={1}>
              {bounty.title}
            </Box>
            {
              viewerCanModifyBounty === true && (
                <EditIcon fontSize='small' onClick={toggleDialog} />

              )
            }
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ float: 'right' }}>
            <BountyBadge bounty={bounty} hideLink={true} />
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ my: '10px' }}>
        <Typography variant='h5'>Information</Typography>
        <CharmEditor content={bounty.descriptionNodes as any}></CharmEditor>
      </Box>

      <Grid container direction='column'>
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
            // eslint-disable-next-line eqeqeq
            bounty.assignee == undefined && (
              <Box>
                <p>Open to applications</p>
                <Button>Apply now</Button>
              </Box>
            )
          }

        </Grid>
      </Grid>

      <BountyApplicantList bountyId={bounty.id} />
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
