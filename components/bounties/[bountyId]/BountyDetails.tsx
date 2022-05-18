import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/material/Tooltip';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import Box from '@mui/material/Box';
import Alert, { AlertColor } from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Application, Bounty } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import charmClient from 'charmClient';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import Avatar from 'components/common/Avatar';
import { Modal } from 'components/common/Modal';
import CharmEditor from 'components/common/CharmEditor/CharmEditor';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { useContributors } from 'hooks/useContributors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useBounties } from 'hooks/useBounties';
import useENSName from 'hooks/useENSName';
import { useUser } from 'hooks/useUser';
import { usePageTitle } from 'hooks/usePageTitle';
import { getDisplayName } from 'lib/users';
import { eToNumber } from 'lib/utilities/numbers';
import { BountyWithDetails, PageContent } from 'models';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import useIsAdmin from 'hooks/useIsAdmin';
import BountyModal from '../components/BountyModal';
import { FormValues as BountyFormValues } from '../components/BountyEditorForm';
import BountyStatusBadge from '../components/BountyStatusBadge';
import BountyPaymentButton from './components/BountyPaymentButton';
import { BountyApplicantList } from './components/BountyApplicantList';
import { ApplicationEditorForm } from './components/ApplicationEditorForm';

export type BountyDetailsPersona = 'applicant' | 'reviewer' | 'admin'

export default function BountyDetails () {
  const [space] = useCurrentSpace();
  const [applications, setApplications] = useState([] as Application []);
  const [_, setPageTitle] = usePageTitle();

  const [user] = useUser();
  const [contributors] = useContributors();
  const { bounties, setBounties } = useBounties();
  const [bounty, setBounty] = useState<BountyWithDetails | null>(null);

  const [formFocusKey, setFormFocusKey] = useState<keyof BountyFormValues | undefined>(undefined);

  const bountyEditModal = usePopupState({ variant: 'popover', popupId: 'ERC20-popup' });
  const bountyApproveModal = usePopupState({ variant: 'popover', popupId: 'approve-bounty' });
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [showBountyDeleteDialog, setShowBountyDeleteDialog] = useState(false);
  const [paymentError, setPaymentError] = useState<{severity: AlertColor, message: string} | null>(null);

  const router = useRouter();

  const isAssignee = bounty && user && bounty.assignee === user.id;
  const isReviewer = bounty && user && bounty.reviewer === user.id;
  const isAdmin = useIsAdmin();

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
    setPageTitle(foundBounty.title);
  }

  function getContributor (userId: string) {
    return contributors.find(c => c.id === userId);
  }

  useEffect(() => {
    loadBounty();
  }, []);

  useEffect(() => {

    if (typeof bounty?.rewardAmount === 'number' && bounty?.rewardAmount > 0) {
      setFormFocusKey(undefined);
    }
    else {
      setFormFocusKey('rewardAmount');
    }
  }, [bounty]);

  // Infer if the user is an admin or not

  // For now, admins can do all actions. We will refine this model later on
  const viewerCanModifyBounty: boolean = isAdmin === true;

  const walletAddressForPayment = applications?.find(app => {
    return app.createdBy === bounty?.assignee;
  })?.walletAddress;

  async function saveBounty (updatedBounty: Bounty) {
    // The API should return a Bounty with a list of transactions
    updateBounty({ ...updatedBounty, applications } as any);
    bountyEditModal.close();
  }

  function toggleBountyDeleteDialog () {
    setShowBountyDeleteDialog(!showBountyDeleteDialog);
  }

  async function deleteBounty () {
    await charmClient.deleteBounty(bounty!.id);
    const filteredBounties = bounties.filter(bountyInList => {
      return bountyInList.id !== bounty!.id;
    });
    setBounties(filteredBounties);
    router.push(`/${space!.domain}/bounties`);
  }

  function applicationSubmitted () {
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

  const approvableBounty = bounty?.status === 'suggestion' && isAdmin && bounty.rewardAmount !== 0;

  async function approveBountySuggestion () {
    const approvedBounty = await charmClient.updateBounty(bounty!.id, { status: 'open' });
    updateBounty(approvedBounty);
    bountyApproveModal.close();
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

  if (!space || !bounty) {
    return (
      <Container top={100}>
        Loading bounty...
      </Container>
    );
  }

  return (
    <ScrollableWindow>
      <Box py={3} px='80px'>

        <Container top={20}>

          <Box sx={{
            justifyContent: 'space-between',
            gap: 1,
            display: 'flex'
          }}
          >
            <Box flexGrow={1}>
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
                    <Tooltip arrow placement='top' title={`Edit bounty ${bounty.status === 'suggestion' ? 'suggestion' : ''}`}>
                      <IconButton onClick={bountyEditModal.open}>
                        <EditIcon fontSize='medium' />
                      </IconButton>
                    </Tooltip>
                    <Tooltip arrow placement='top' title={`Delete bounty ${bounty.status === 'suggestion' ? 'suggestion' : ''}`}>
                      <IconButton sx={{ mx: -1 }} onClick={toggleBountyDeleteDialog}>
                        <DeleteIcon fontSize='medium' />
                      </IconButton>
                    </Tooltip>
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
              <BountyStatusBadge bounty={bounty} />
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
              {
              bounty.status !== 'suggestion' && (
                <>
                  <Grid item xs={6}>
                    <Card sx={{ height: '100%', p: 2 }} variant='outlined'>
                      <CardHeader subheader='Reviewer' sx={{ pt: 0 }} />
                      <CardContent sx={{ minHeight: '70px', pt: 0.5, pb: 0.5 }}>
                        <Box
                          component='div'
                          sx={{ display: 'flex',
                            gap: 1,
                            alignItems: 'center',
                            justifyContent: 'flex-start' }}
                        >
                          {
              reviewerUser ? (
                <>
                  <Avatar avatar={reviewerUser.avatar} name={reviewerENSName || getDisplayName(reviewerUser)} />
                  <Typography variant='h6' component='span' sx={{ pl: 0.5 }}>
                    {reviewerName}
                  </Typography>
                </>
              ) : <Typography variant='body2'>No reviewer assigned</Typography>

              }

                        </Box>
                      </CardContent>
                      <CardActions sx={{ pt: 0.5 }}>

                        <Box flexDirection='row' gap={1} display='flex'>
                          {/* Assign reviewer */}
                          {!reviewerUser && isAdmin && (
                          <Button color='secondary' variant='outlined' onClick={bountyEditModal.open}>Assign reviewer</Button>
                          )}
                          {/* Review completed work */}
                          {bounty.status === 'review' && isReviewer && (
                          <>
                            <Button onClick={markAsComplete}>Mark as complete</Button>
                            <Button color='secondary' variant='outlined' onClick={moveToAssigned}>Reopen task</Button>
                          </>
                          )}
                          {/* Proceed with payment */}
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
                        {paymentError && (
                        <Alert sx={{ mt: 2, display: 'flex', '& .MuiAlert-message': { minWidth: '0px' } }} severity={paymentError.severity}>
                          <Box component='div' sx={{ display: 'inline', wordWrap: 'break-word' }}>
                            {paymentError.message}
                          </Box>
                        </Alert>
                        )}
                      </Box>
                    )
                  }
                        </Box>

                      </CardActions>
                    </Card>
                  </Grid>

                  <Grid item xs={6}>
                    <Card sx={{ height: '100%', p: 2 }} variant='outlined'>
                      <CardHeader subheader='Assignee' sx={{ pt: 0 }} />
                      <CardContent sx={{ minHeight: '70px', pt: 0.5, pb: 0.5 }}>
                        <Box component='div' sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-start' }}>
                          {assigneeName && (
                          <>
                            <Avatar avatar={assigneeUser?.avatar} name={assigneeENSName || getDisplayName(assigneeUser)} />
                            <Typography variant='h6' component='span' sx={{ pl: 0.5 }}>
                              {assigneeName}
                            </Typography>
                          </>
                          )}
                          {!assigneeName && !isApplicant && (

                          <Typography variant='body2'>Nobody has been assigned to this bounty yet</Typography>

                          )}
                          {!assigneeName && isApplicant && (
                          <Box>
                            <Typography variant='body2'>You've applied to this bounty.</Typography>
                          </Box>
                          )}

                        </Box>
                      </CardContent>
                      <CardActions sx={{ pt: 0.5, pb: 0.5 }}>
                        <Box flexDirection='row' gap={1} display='flex'>
                          { bounty.status === 'open' && !isApplicant && (
                          <Button disabled={user?.addresses.length === 0} onClick={toggleApplicationDialog}>Apply now</Button>
                          )}
                          {isAssignee && bounty.status === 'assigned' && (
                          <Button onClick={requestReview}>Request review</Button>
                          )}
                        </Box>
                      </CardActions>
                    </Card>
                  </Grid>
                </>
              )
            }
              {
              bounty.status === 'suggestion' && isAdmin && (
                <Grid item xs={12}>
                  <Tooltip arrow placement='top' title={approvableBounty ? 'Approve bounty suggestion' : 'You must define a reward amount before you can approve this bounty suggestion.'}>
                    <Button
                      color='primary'
                      onClick={
                      approvableBounty ? bountyApproveModal.open
                        : bountyEditModal.open
}
                    >Approve suggestion
                    </Button>
                  </Tooltip>
                </Grid>
              )
            }

            </Grid>

          </Box>

          {
          bounty && bounty.status !== 'suggestion' && (
            <BountyApplicantList
              applications={applications}
              bounty={bounty}
              bountyReassigned={loadBounty}
              updateApplication={toggleApplicationDialog}
            />
          )
        }
          <BountyModal onSubmit={saveBounty} mode='update' bounty={bounty} open={bountyEditModal.isOpen} onClose={bountyEditModal.close} focusKey={formFocusKey} />

          <Modal title='Approve bounty suggestion' open={bountyApproveModal.isOpen} onClose={bountyApproveModal.close}>

            <Typography sx={{ whiteSpace: 'pre-wrap' }}>
              {
              'Confirm you want to approve this bounty.\r\n\r\nIts status will be changed to \'open\' and workspace members will be able to apply.'
              }

            </Typography>

            <Box component='div' sx={{ columnSpacing: 2, mt: 3 }}>
              <Button
                color='primary'
                sx={{ mr: 2, fontWeight: 'bold' }}
                onClick={approveBountySuggestion}
              >
                Approve
              </Button>

              <Button color='secondary' onClick={bountyApproveModal.close}>Cancel</Button>
            </Box>
          </Modal>

          <Modal title='Bounty Application' size='large' open={showApplicationDialog} onClose={toggleApplicationDialog}>
            <ApplicationEditorForm
              bountyId={bounty.id}
              onSubmit={applicationSubmitted}
              proposal={applicantProposal}
              mode={applicantProposal ? 'update' : 'create'}
            />
          </Modal>

          <Modal open={showBountyDeleteDialog} onClose={toggleBountyDeleteDialog}>

            {
            bounty.status !== 'open' && (
            <Typography sx={{ mb: 1 }}>
              {
                (bounty.status === 'complete' || bounty.status === 'paid') ? 'This bounty is already complete.' : 'This is bounty in progress.'
              }

            </Typography>
            )
          }

            <Typography>
              Are you sure you want to delete this bounty?
            </Typography>

            <Box component='div' sx={{ columnSpacing: 2, mt: 3 }}>
              <Button color='error' sx={{ mr: 2, fontWeight: 'bold' }} onClick={deleteBounty}>Delete bounty</Button>

              <Button color='secondary' onClick={toggleBountyDeleteDialog}>Cancel</Button>
            </Box>

          </Modal>
        </Container>
      </Box>
    </ScrollableWindow>
  );
}
