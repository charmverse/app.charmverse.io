import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import EditIcon from '@mui/icons-material/Edit';
import Table from '@mui/material/Table';
import Typography from '@mui/material/Typography';
import { Bounty } from '@prisma/client';
import charmClient from 'charmClient';
import { BountyBadge } from 'components/bounties/BountyBadge';
import { PageLayout } from 'components/common/page-layout';
import BountyModal from 'components/bounties/BountyModal';
import CharmEditor from 'components/editor/CharmEditor';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { useRouter } from 'next/router';
import { ReactElement, useEffect, useState, useRef, useCallback } from 'react';
import { BountyApplicantList } from 'components/bounties/BountyApplicantList';
import { ApplicationEditorForm } from 'components/bounties/ApplicationEditorForm';
import { Modal } from 'components/common/Modal';
import { BountyWithApplications } from 'models';

type BountyDetailsPersona = 'applicant' | 'reviewer' | 'admin'

export default function BountyDetails () {

  const [space] = useCurrentSpace();

  const [user] = useUser();

  const [bounty, setBounty] = useState(null as any as BountyWithApplications);
  const [showBountyEditDialog, setShowBountyEditDialog] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);

  const [isApplicant, setIsApplicant] = useState(true);
  const [isAssignee, setIsAssignee] = useState(true);
  const [isReviewer, setIsReviewer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadBounty();
  }, []);

  useEffect(() => {
    if (user && bounty && space) {
      const adminRoleFound = user.spaceRoles.findIndex(spaceRole => {
        return spaceRole.spaceId === space!.id && spaceRole.role === 'admin';
      }) > -1;
      setIsAdmin(adminRoleFound);

      const userIsReviewer = bounty.reviewer === user.id;
      setIsReviewer(userIsReviewer);

      const userHasApplied = bounty.applications.findIndex(application => {
        return application.applicantId === user.id;
      }) > -1;

      setIsApplicant(userHasApplied);

      const userIsAssignee = bounty.assignee === user.id;
      setIsAssignee(userIsAssignee);
    }
  }, [user, bounty, space]);

  // Infer if the user is an admin or not

  // For now, admins can do all actions. We will refine this model later on
  const viewerCanModifyBounty: boolean = isAdmin === true;

  const router = useRouter();

  const walletAddressForPayment = bounty?.applications?.find(app => {
    return app.applicantId === bounty.assignee;
  })?.walletAddress;

  async function loadBounty () {
    const { bountyId } = router.query;
    const foundBounty = await charmClient.getBounty(bountyId as string);
    setBounty(foundBounty);
  }

  function toggleBountyEditDialog () {

    setShowBountyEditDialog(!showBountyEditDialog);
  }

  function applicationSubmitted () {
    toggleApplicationDialog();
    loadBounty();
  }

  function toggleApplicationDialog () {
    setShowApplicationDialog(!showApplicationDialog);
  }

  async function requestReview () {
    const updatedBounty = await charmClient.changeBountyStatus(bounty.id, 'review');
    setBounty(updatedBounty);
  }

  async function moveToAssigned () {
    const updatedBounty = await charmClient.changeBountyStatus(bounty.id, 'assigned');
    setBounty(updatedBounty);
  }

  async function markAsComplete () {
    const updatedBounty = await charmClient.changeBountyStatus(bounty.id, 'complete');
    setBounty(updatedBounty);
  }

  async function markAsPaid () {
    const updatedBounty = await charmClient.changeBountyStatus(bounty.id, 'paid');
    setBounty(updatedBounty);
  }

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

      <BountyModal onSubmit={loadBounty} mode='update' bounty={bounty} open={showBountyEditDialog} onClose={toggleBountyEditDialog} />

      <Modal open={showApplicationDialog} onClose={toggleApplicationDialog}>
        <ApplicationEditorForm bountyId={bounty.id} onSubmit={applicationSubmitted}></ApplicationEditorForm>
      </Modal>

      <Grid container direction='column' justifyContent='space-between'>
        <Grid item xs={8}>
          <Typography variant='h1'>
            <Box component='span' px={1}>
              {bounty.title}
            </Box>
            {
              viewerCanModifyBounty === true && (
                <EditIcon fontSize='small' onClick={toggleBountyEditDialog} />
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

          <Box component='div' sx={{ display: 'flex' }}>

            <Avatar></Avatar>
            <Box component='span' px={1}>
              {
              isReviewer === true && (
                <>
                  You
                  { bounty.status === 'review' && (
                  <Box>
                    <Button onClick={markAsComplete}>Mark as complete</Button>
                    <Button onClick={moveToAssigned}>Reopen task</Button>
                  </Box>
                  )}
                </>
              )
              }
              {
              isReviewer !== true && (
                bounty.reviewer
              )
            }
            </Box>
          </Box>

        </Grid>

        <Grid item xs={6}>
          <Typography variant='h5'>Assignee</Typography>

          <Box component='div' display='flex'>
            {

              isAssignee === true && (
                <>
                  <Avatar></Avatar>
                  <Box component='span' px={1}>

                    {' '}
                    you

                    { bounty.status === 'assigned' && (<Button onClick={requestReview}>Request review</Button>)}
                  </Box>
                </>
              )
            }
            {

              (isAssignee === false && bounty.assignee) && (

                <p>{bounty.assignee}</p>
              )
            }
            {

              (isApplicant === true && isAssignee === false) && (

                <p>You've applied to this bounty.</p>
              )
              }
            {

              (isAssignee === false && !bounty.assignee) && (

                <p>This bounty is awaiting assignment</p>
              )
            }
          </Box>
          {
            isApplicant === false && (
              <Box>
                <Button onClick={toggleApplicationDialog}>Apply now</Button>
              </Box>
            )
          }

          {
            (bounty.status === 'complete' && (isReviewer || isAdmin)) && (
              <Box>
                Wallet address
                {' '}
                {walletAddressForPayment}
                <Button onClick={markAsPaid}>Mark as paid</Button>
              </Box>
            )
          }

        </Grid>
      </Grid>

      {
        bounty && (<BountyApplicantList bounty={bounty} bountyReassigned={loadBounty} />)
      }

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
