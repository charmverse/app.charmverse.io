import EditIcon from '@mui/icons-material/Edit';
import { IconButton } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import charmClient from 'charmClient';
import { ApplicationEditorForm } from 'components/bounties/ApplicationEditorForm';
import { BountyApplicantList } from 'components/bounties/BountyApplicantList';
import { BountyBadge } from 'components/bounties/BountyBadge';
import BountyModal from 'components/bounties/BountyModal';
import BountyPaymentButton from 'components/bounties/BountyPaymentButton';
import { Modal } from 'components/common/Modal';
import { PageLayout } from 'components/common/page-layout';
import CharmEditor from 'components/editor/CharmEditor';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { BountyWithApplications } from 'models';
import { useRouter } from 'next/router';
import { ReactElement, useEffect, useState } from 'react';

export type BountyDetailsPersona = 'applicant' | 'reviewer' | 'admin'

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
        return application.createdBy === user.id;
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
    return app.createdBy === bounty.assignee;
  })?.walletAddress;

  async function loadBounty () {
    const { bountyId } = router.query;
    const foundBounty = await charmClient.getBounty(bountyId as string);
    setBounty(foundBounty);
  }

  async function saveBounty () {
    setShowBountyEditDialog(false);
    await loadBounty();
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
    <Box p={5}>
      <BountyModal onSubmit={saveBounty} mode='update' bounty={bounty} open={showBountyEditDialog} onClose={toggleBountyEditDialog} />

      <Modal open={showApplicationDialog} onClose={toggleApplicationDialog}>
        <ApplicationEditorForm bountyId={bounty.id} onSubmit={applicationSubmitted}></ApplicationEditorForm>
      </Modal>

      <Box sx={{
        justifyContent: 'space-between',
        gap: 2,
        display: 'flex'
      }}
      >
        <Box sx={{
          flexGrow: 1
        }}
        >
          <Typography
            variant='h1'
            sx={{
              display: 'flex',
              gap: 0.5,
              alignItems: 'center'
            }}
          >
            <Box component='span'>
              {bounty.title}
            </Box>
            {
              viewerCanModifyBounty === true && (
                <IconButton>
                  <EditIcon fontSize='small' onClick={toggleBountyEditDialog} />
                </IconButton>
              )
            }
          </Typography>
        </Box>
        <Box>
          <BountyBadge bounty={bounty} hideLink={true} />
        </Box>
      </Box>

      <Box my={3}>
        <Box my={2}>
          <Typography variant='h5' sx={{ fontWeight: 'semibold' }}>Information</Typography>
          <CharmEditor content={bounty.descriptionNodes as any}></CharmEditor>
        </Box>

        <Grid
          container
          direction='row'
        >
          <Grid item xs={7}>
            <Box>
              <Typography variant='h5' my={1}>Reviewer</Typography>
              <Box component='div' sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Avatar />
                {
                  isReviewer === true && (
                    <>
                      <Typography variant='h6' component='span'>
                        You
                      </Typography>
                      {bounty.status === 'review' && (
                        <>
                          <Button onClick={markAsComplete}>Mark as complete</Button>
                          <Button onClick={moveToAssigned}>Reopen task</Button>
                        </>
                      )}
                      {
                        (bounty.status === 'complete' && (isReviewer || isAdmin)) && (
                        <BountyPaymentButton
                          receiver={walletAddressForPayment!}
                          amount={bounty.rewardAmount.toString()}
                          tokenSymbol='ETH'
                        />
                        )
                      }
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

          <Grid item xs={5}>
            <Box>
              <Typography variant='h5' my={1}>Assignee</Typography>
              <Box component='div' sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {
                  isAssignee === true ? (
                    <>
                      <Avatar />
                      <Typography variant='h6' component='span'>
                        You
                      </Typography>
                      {bounty.status === 'assigned' && (
                        <Button onClick={requestReview}>Request review</Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Typography>{bounty.assignee ?? 'This bounty is awaiting assignment.'}</Typography>
                      {isApplicant ? <Typography>You've applied to this bounty.</Typography> : (
                        <Button onClick={toggleApplicationDialog}>Apply now</Button>
                      )}
                    </>
                  )
                }
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {
        bounty && (<BountyApplicantList bounty={bounty} bountyReassigned={loadBounty} />)
      }
    </Box>
  );
}

BountyDetails.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
