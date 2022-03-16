import EditIcon from '@mui/icons-material/Edit';
import { IconButton } from '@mui/material';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import Alert, { AlertColor } from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Application, Bounty } from '@prisma/client';
import charmClient from 'charmClient';
import { getChainExplorerLink } from 'connectors';
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
import { useBounties } from 'hooks/useBounties';
import useENSName from 'hooks/useENSName';
import { useUser } from 'hooks/useUser';
import { getDisplayName } from 'lib/users';
import { eToNumber } from 'lib/utilities/numbers';
import { BountyWithDetails, PageContent } from 'models';
import { useRouter } from 'next/router';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { shortenHex } from 'lib/utilities/strings';
import { humanFriendlyDate } from 'lib/utilities/dates';
import Link from 'next/link';

export type BountyDetailsPersona = 'applicant' | 'reviewer' | 'admin'

export default function BountyDetails () {
  const [space] = useCurrentSpace();
  const [applications, setApplications] = useState([] as Application []);

  const [user] = useUser();
  const [contributors] = useContributors();
  const { bounties, setBounties } = useBounties();
  const [bounty, setBounty] = useState<BountyWithDetails | null>(null);

  const [showBountyEditDialog, setShowBountyEditDialog] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [showBountyDeleteDialog, setShowBountyDeleteDialog] = useState(false);
  const [paymentError, setPaymentError] = useState<{severity: AlertColor, message: string} | null>(null);

  const router = useRouter();

  const isAssignee = bounty && user && bounty.assignee === user.id;
  const isReviewer = bounty && user && bounty.reviewer === user.id;

  const isAdmin = space && user?.spaceRoles.some(spaceRole => {
    return spaceRole.spaceId === space.id && spaceRole.role === 'admin';
  });

  const isApplicant = user && applications.some(application => {
    return application.createdBy === user.id;
  });
  const applicantProposal = applications.find(application => {
    return application.createdBy === user?.id;
  });

  const reviewerUser = (bounty?.reviewer && getContributor(bounty.reviewer)) || undefined;
  const reviewerENSName = useENSName(reviewerUser?.addresses[0]);
  const reviewerName = isReviewer ? 'You' : reviewerENSName || getDisplayName(reviewerUser);
  const assigneeUser = (bounty?.assignee && getContributor(bounty.assignee)) || undefined;
  const assigneeENSName = useENSName(assigneeUser?.addresses[0]);
  const assigneeName = isAssignee ? 'You' : assigneeENSName || getDisplayName(assigneeUser);

  const CharmEditorMemoized = useMemo(() => {
    // Only show the editor if the description exist
    // Otherwise it shows the `Type / for commands` placeholder
    return bounty && bounty.description ? (
      <CharmEditor
        readOnly
        key={bounty.description}
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

  const walletAddressForPayment = applications?.find(app => {
    return app.createdBy === bounty?.assignee;
  })?.walletAddress;

  async function saveBounty (updatedBounty: Bounty) {
    // The API should return a Bounty with a list of transactions
    updateBounty({ ...updatedBounty, applications } as any);
    setShowBountyEditDialog(false);
  }

  function toggleBountyEditDialog () {
    setShowBountyEditDialog(!showBountyEditDialog);
  }

  function toggleBountyDeleteDialog () {
    setShowBountyDeleteDialog(!showBountyDeleteDialog);
  }

  const deleteableBounty = bounty?.status === 'open';

  async function deleteBounty () {
    await charmClient.deleteBounty(bounty!.id);
    const filteredBounties = bounties.filter(bountyInList => {
      return bountyInList.id !== bounty!.id;
    });
    setBounties(filteredBounties);
    router.push(`/${space!.domain}/bounties`);
  }

  function applicationSubmitted (application: Application) {
    toggleApplicationDialog();
    loadBounty();
  }

  function toggleApplicationDialog () {
    setShowApplicationDialog(!showApplicationDialog);
  }

  async function requestReview () {
    const updatedBounty = await charmClient.changeBountyStatus(bounty!.id, 'review');
    updateBounty(updatedBounty);
  }

  async function moveToAssigned () {
    const updatedBounty = await charmClient.changeBountyStatus(bounty!.id, 'assigned');
    updateBounty(updatedBounty);
  }

  async function markAsComplete () {
    const updatedBounty = await charmClient.changeBountyStatus(bounty!.id, 'complete');
    updateBounty(updatedBounty);
  }

  async function recordPaymentSuccess (transactionId: string, chainId: number | string) {
    setPaymentError(null);
    await charmClient.recordTransaction({
      bountyId: bounty!.id,
      transactionId,
      chainId: chainId.toString()
    });
    const updatedBounty = await charmClient.changeBountyStatus(bounty!.id, 'paid');
    updateBounty(updatedBounty);

  }

  function updateBounty (updatedBounty: BountyWithDetails) {
    const inMemoryBountyIndex = bounties.findIndex(bountyInMemory => {
      return bountyInMemory.id === updatedBounty.id;
    });
    if (inMemoryBountyIndex > -1) {
      const copiedBounties = bounties.slice();
      copiedBounties.splice(inMemoryBountyIndex, 1, updatedBounty);
      setBounties(copiedBounties);
    }

    setBounty(updatedBounty);
  }

  function onError (err: string | null, severity: AlertColor = 'error') {

    if (err === null) {
      setPaymentError(null);
    }
    else {
      setPaymentError({
        message: err,
        severity
      });
    }

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
        <ApplicationEditorForm
          bountyId={bounty.id}
          onSubmit={applicationSubmitted}
          proposal={applicantProposal}
          mode={applicantProposal ? 'update' : 'create'}
        />
      </Modal>

      <Modal open={showBountyDeleteDialog} onClose={toggleBountyDeleteDialog}>

        <Typography>
          Are you sure you want to delete this bounty?
        </Typography>

        <Box component='div' sx={{ columnSpacing: 2, mt: 3 }}>
          <Button color='error' sx={{ mr: 2, fontWeight: 'bold' }} onClick={deleteBounty}>Delete bounty</Button>

          {
            bounty.status === 'open' && <Button color='secondary' onClick={toggleBountyDeleteDialog}>Cancel</Button>
          }
        </Box>

      </Modal>

      <Box sx={{
        justifyContent: 'space-between',
        gap: 1,
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
                <>
                  <IconButton onClick={toggleBountyEditDialog}>
                    <EditIcon fontSize='small' />
                  </IconButton>
                  {
                    deleteableBounty === true && (
                    <IconButton sx={{ mx: -1 }} onClick={toggleBountyDeleteDialog}>
                      <DeleteIcon fontSize='small' sx={{ color: 'red.main' }} />
                    </IconButton>
                    )
                  }
                </>
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
              {reviewerUser ? (
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
                    (isReviewer || isAdmin) && (
                      <Box sx={{
                        display: 'flex',
                        gap: 1
                      }}
                      >
                        {bounty.status === 'review' && isReviewer && (
                          <Box flexDirection='column' gap={1} display='flex'>
                            <Button onClick={markAsComplete}>Mark as complete</Button>
                            <Button color='secondary' variant='outlined' onClick={moveToAssigned}>Reopen task</Button>
                          </Box>
                        )}
                        {
                          bounty.status === 'complete' && (
                            <Box>
                              <BountyPaymentButton
                                receiver={walletAddressForPayment!}
                                amount={eToNumber(bounty.rewardAmount)}
                                tokenSymbolOrAddress={bounty.rewardToken}
                                onSuccess={recordPaymentSuccess}
                                onError={onError}
                                chainIdToUse={bounty.chainId!}
                              />
                            </Box>
                          )
                        }
                      </Box>
                    )
                  }
                </Box>
              ) : <Typography variant='body2'>No reviewer assigned</Typography>}

              {paymentError && (
                <Alert sx={{ mt: 2, display: 'flex', '& .MuiAlert-message': { minWidth: '0px' } }} severity={paymentError.severity}>
                  <Box component='div' sx={{ display: 'inline', wordWrap: 'break-word' }}>
                    {paymentError.message}
                  </Box>
                </Alert>
              )}
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

                        <Button
                          sx={{ mt: 2 }}
                          onClick={toggleApplicationDialog}
                        >
                          <Box sx={{ pr: 1 }}>Edit your payment details</Box>
                          <EditOutlinedIcon />
                        </Button>
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
                        isApplicant ? (
                          <Box>
                            <Typography>You've applied to this bounty.</Typography>
                            <Button
                              sx={{ mt: 2 }}
                              onClick={toggleApplicationDialog}
                            >
                              <Box sx={{ pr: 1 }}>Edit your application</Box>
                              <EditOutlinedIcon />
                            </Button>
                          </Box>
                        ) : (
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
