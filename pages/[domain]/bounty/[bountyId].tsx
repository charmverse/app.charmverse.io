import EditIcon from '@mui/icons-material/Edit';
import { IconButton } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Application } from '@prisma/client';
import charmClient from 'charmClient';
import { ApplicationEditorForm } from 'components/bounties/ApplicationEditorForm';
import { BountyApplicantList } from 'components/bounties/BountyApplicantList';
import { BountyBadge } from 'components/bounties/BountyBadge';
import BountyModal from 'components/bounties/BountyModal';
import BountyPaymentButton from 'components/bounties/BountyPaymentButton';
import Avatar from 'components/common/Avatar';
import { Modal } from 'components/common/Modal';
import { PageLayout } from 'components/common/page-layout';
import CharmEditor from 'components/editor/CharmEditor';
import { Container } from 'components/editor/Editor';
import { useContributors } from 'hooks/useContributors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useENSName from 'hooks/useENSName';
import { useUser } from 'hooks/useUser';
import { getDisplayName } from 'lib/users';
import { BountyWithApplications, PageContent } from 'models';
import { useRouter } from 'next/router';
import { ReactElement, useEffect, useMemo, useState } from 'react';

export type BountyDetailsPersona = 'applicant' | 'reviewer' | 'admin'

export default function BountyDetails () {

  const [space] = useCurrentSpace();
  const [applications, setApplications] = useState([] as Application []);

  const [user] = useUser();
  const [contributors] = useContributors();

  const [bounty, setBounty] = useState<BountyWithApplications | null>(null);
  const [showBountyEditDialog, setShowBountyEditDialog] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);

  const router = useRouter();

  const isAssignee = bounty && user && bounty.assignee === user.id;
  const isReviewer = bounty && user && bounty.reviewer === user.id;

  const isAdmin = space && user?.spaceRoles.some(spaceRole => {
    return spaceRole.spaceId === space.id && spaceRole.role === 'admin';
  });

  const isApplicant = user && bounty?.applications.some(application => {
    return application.createdBy === user.id;
  });

  const reviewerUser = (bounty?.reviewer && getContributor(bounty.reviewer)) || undefined;
  const reviewerENSName = useENSName(reviewerUser?.addresses[0]);
  const reviewerName = isReviewer ? 'You' : reviewerENSName || getDisplayName(reviewerUser);
  const assigneeUser = (bounty?.assignee && getContributor(bounty.assignee)) || undefined;
  const assigneeENSName = useENSName(assigneeUser?.addresses[0]);
  const assigneeName = isAssignee ? 'You' : assigneeENSName || getDisplayName(assigneeUser);

  const CharmEditorMemoized = useMemo(() => {
    return bounty ? (
      <CharmEditor
        readOnly
        content={bounty.descriptionNodes as PageContent}
      />
    ) : null;
  }, [bounty]);

  async function loadBounty () {
    const { bountyId } = router.query;
    const foundBounty = await charmClient.getBounty(bountyId as string);
    const applicationList = await charmClient.listApplications(foundBounty.id);
    setApplications(applicationList);
    setBounty(foundBounty);
  }

  function getContributor (userId: string) {
    return contributors.find(c => c.id === userId);
  }

  useEffect(() => {
    loadBounty();
  }, []);

  // Infer if the user is an admin or not

  // For now, admins can do all actions. We will refine this model later on
  const viewerCanModifyBounty: boolean = isAdmin === true;

  const walletAddressForPayment = bounty?.applications?.find(app => {
    return app.createdBy === bounty.assignee;
  })?.walletAddress;

  async function saveBounty () {
    setShowBountyEditDialog(false);
    await loadBounty();
  }

  function toggleBountyEditDialog () {
    setShowBountyEditDialog(!showBountyEditDialog);
  }

  function applicationSubmitted (application: Application) {
    toggleApplicationDialog();
    setApplications([...applications, application]);
  }

  function toggleApplicationDialog () {
    setShowApplicationDialog(!showApplicationDialog);

  }

  async function requestReview () {
    const updatedBounty = await charmClient.changeBountyStatus(bounty!.id, 'review');
    setBounty(updatedBounty);
  }

  async function moveToAssigned () {
    const updatedBounty = await charmClient.changeBountyStatus(bounty!.id, 'assigned');
    setBounty(updatedBounty);
  }

  async function markAsComplete () {
    const updatedBounty = await charmClient.changeBountyStatus(bounty!.id, 'complete');
    setBounty(updatedBounty);
  }

  async function markAsPaid () {
    const updatedBounty = await charmClient.changeBountyStatus(bounty!.id, 'paid');
    setBounty(updatedBounty);
  }

  //  charmClient.getBounty();

  if (!space || !bounty) {
    return (
      <Container top={100}>
        Loading bounty...
      </Container>
    );
  }

  return (
    <Container top={100}>
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
              alignItems: 'center',
              fontSize: '40px',
              fontWeight: 700,
              gap: 1
            }}
          >
            <Box component='span'>
              {bounty.title}
            </Box>
            {
              viewerCanModifyBounty === true && (
                <IconButton onClick={toggleBountyEditDialog}>
                  <EditIcon fontSize='small' />
                </IconButton>
              )
            }
          </Typography>
        </Box>
        <Box sx={{
          display: 'flex',
          alignItems: 'center'
        }}
        >
          <BountyBadge bounty={bounty} hideLink={true} />
        </Box>
      </Box>

      <Box mt={3} mb={5}>
        <Box my={2}>
          {CharmEditorMemoized}
        </Box>
        <Grid
          container
          direction='row'
          spacing={2}
        >
          <Grid item xs={6}>
            <Card sx={{ height: '100%', p: 3 }} variant='outlined'>
              <Typography variant='body2' color='secondary' mb={2}>Reviewer</Typography>
              <Box
                component='div'
                sx={{ display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                  justifyContent: 'space-between' }}
              >
                <Box display='flex' alignItems='center' gap={1}>
                  <Avatar name={reviewerENSName || getDisplayName(reviewerUser)} />
                  <Typography variant='h6' component='span'>
                    {reviewerName}
                  </Typography>
                </Box>
                {
                  isReviewer === true && (
                    <Box sx={{
                      display: 'flex',
                      gap: 1
                    }}
                    >
                      {bounty.status === 'review' && (
                        <Box flexDirection='column' gap={1} display='flex'>
                          <Button onClick={markAsComplete}>Mark as complete</Button>
                          <Button onClick={moveToAssigned}>Reopen task</Button>
                        </Box>
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
                    </Box>
                  )
                }
              </Box>
            </Card>
          </Grid>

          <Grid item xs={6}>
            <Card sx={{ height: '100%', p: 3 }} variant='outlined'>
              <Typography variant='body2' color='secondary' mb={2}>Assignee</Typography>
              <Box component='div' sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
                {
                  isAssignee === true ? (
                    <>
                      <Box sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center'
                      }}
                      >
                        <Avatar />
                        <Typography variant='h6' component='span'>
                          You
                        </Typography>
                      </Box>
                      {bounty.status === 'assigned' && (
                        <Button onClick={requestReview}>Request review</Button>
                      )}
                    </>
                  ) : (
                    <>
                      {assigneeName && (
                        <Box display='flex' alignItems='center'>
                          <Avatar name={assigneeENSName || getDisplayName(assigneeUser)} />
                          <Typography variant='h6' component='span' sx={{ pl: 2 }}>
                            {assigneeName}
                          </Typography>
                        </Box>
                      )}
                      {!assigneeName && (
                        isApplicant ? <Typography>You've applied to this bounty.</Typography> : (
                          <Button onClick={toggleApplicationDialog}>Apply now</Button>
                        )
                      )}
                    </>
                  )
                }
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {
        bounty && (<BountyApplicantList applications={applications} bounty={bounty} bountyReassigned={loadBounty} />)
      }
    </Container>
  );
}

BountyDetails.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
