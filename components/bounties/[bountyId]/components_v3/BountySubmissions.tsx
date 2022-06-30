import { useTheme } from '@emotion/react';
import AvatarGroup from '@mui/material/AvatarGroup';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Application, ApplicationStatus } from '@prisma/client';
import charmClient from 'charmClient';
import { Modal } from 'components/common/Modal';
import { useBounties } from 'hooks/useBounties';
import { useContributors } from 'hooks/useContributors';
import { useUser } from 'hooks/useUser';
import { applicantIsSubmitter, countValidSubmissions, moveUserApplicationToFirstRow, submissionsCapReached } from 'lib/applications/shared';
import { fancyTrim } from 'lib/utilities/strings';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState, useMemo } from 'react';
import { BrandColor } from 'theme/colors';
import { ApplicationWithTransactions } from 'lib/applications/actions';
import MultiPaymentModal from 'components/bounties/components/MultiPaymentModal';
import { BountyWithDetails, Contributor } from 'models';
import useIsAdmin from 'hooks/useIsAdmin';
import UserDisplay from 'components/common/UserDisplay';
import { AssignedBountyPermissions, BountyReviewer } from 'lib/bounties/interfaces';
import { humaniseBountyAccessConditions } from 'lib/bounties/client';
import useRoles from 'hooks/useRoles';
import { TargetPermissionGroup } from 'lib/permissions/interfaces';
import WorkspaceAvatar from 'components/common/PageLayout/components/Sidebar/WorkspaceAvatar';
import BountySubmissionReviewActions from '../../components/BountySubmissionReviewActions';
import SubmissionEditorForm from './SubmissionEditorForm';
import BountySubmissionContent from '../../components/BountySubmissionContent';

interface Props {
  bounty: BountyWithDetails
  permissions: AssignedBountyPermissions
}

export const SubmissionStatusColors: Record<ApplicationStatus, BrandColor> = {
  applied: 'teal',
  rejected: 'red',
  inProgress: 'yellow',
  review: 'orange',
  complete: 'pink',
  paid: 'gray'
};

export const SubmissionStatusLabels: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  rejected: 'Rejected',
  inProgress: 'In Progress',
  review: 'In Review',
  complete: 'Complete',
  paid: 'Paid'
};

// Initial number of avatars we show, and the number to add each time the user clicks
const defaultAvatarGroupIncrement = 5;

export default function BountySubmissions ({ bounty, permissions }: Props) {

  const [user] = useUser();
  const [contributors] = useContributors();
  const { roleups } = useRoles();
  const theme = useTheme();
  const isAdmin = useIsAdmin();

  const [submissions, setSubmissions] = useState<ApplicationWithTransactions[] | null>(null);
  const { refreshBounty } = useBounties();

  const [currentViewedSubmission, setCurrentViewedSubmission] = useState<Application | null>(null);

  const [maxVisibleUsers, setMaxVisibleUsers] = useState<number>(defaultAvatarGroupIncrement);

  const editSubmissionModal = usePopupState({ variant: 'popover', popupId: 'edit-submission' });

  useEffect(() => {
    refreshSubmissions();
  }, [bounty]);

  function refreshSubmissions () {
    if (bounty) {
      charmClient.listApplications(bounty.id, true)
        .then(foundSubmissions => {
          setSubmissions(foundSubmissions);
        });
    }
  }

  function submitterUpdatedSubmission () {
    editSubmissionModal.close();
    refreshSubmissions();
    refreshBounty(bounty.id);
  }

  const sortedSubmissions = submissions ? moveUserApplicationToFirstRow(submissions.filter(applicantIsSubmitter), user?.id as string) : [];

  const userSubmission = sortedSubmissions.find(sub => sub.createdBy === user?.id);

  // Calculate valid submissions for the UI
  const validSubmissions = countValidSubmissions(submissions ?? []);

  // Only applies if there is a submissions cap
  const capReached = submissionsCapReached({ bounty, submissions: submissions ?? [] });

  const reviewerNames: {
    roles: (TargetPermissionGroup & {name: string})[]
    users: (TargetPermissionGroup & {name: string, profilePic?: string})[]
  } = useMemo(() => {
    return (permissions?.bountyPermissions.reviewer ?? []).map(reviewer => {

      if (reviewer.group === 'role') {
        const name: string = roleups?.find(r => r.id === reviewer.id)?.name ?? '';
        return {
          ...reviewer,
          name
        };
      }
      else {
        const reviewerUser: Contributor | undefined = contributors?.find(c => c.id === reviewer.id);
        return {
          ...reviewer,
          name: reviewerUser?.username ?? '',
          profilePic: reviewerUser?.avatar
        } as (TargetPermissionGroup & {name: string, profilePic?: string});

      }

    }).reduce((reviewersByGroup, reviewer) => {

      if (reviewer.group === 'role') {
        reviewersByGroup.roles.push(reviewer);
      }
      else if (reviewer.group === 'user') {
        reviewersByGroup.users.push(reviewer);
      }

      return reviewersByGroup;
    }, {
      roles: [],
      users: []
    } as {
      roles: (TargetPermissionGroup & {name: string})[]
      users: (TargetPermissionGroup & {name: string, profilePic?: string})[]
    });
  }, [bounty, permissions, roleups]);

  const humanisedSubmitterSentence = humaniseBountyAccessConditions({
    assignees: permissions.bountyPermissions.submitter,
    bounty,
    permissionLevel: 'submitter',
    roles: roleups
  });

  return (
    <Box>
      <Grid container sx={{ mb: 2 }}>
        <Grid container item xs={12} sx={{ mt: 3, mb: 4 }}>
          <Grid item xs={12}>
            <Typography variant='h5'>
              Reviewers
            </Typography>

            {
          reviewerNames.roles.length === 0 && reviewerNames.users.length === 0 && (
            <Typography variant='body2'>
              There are no reviewers assigned to this bounty yet.
            </Typography>
          )
        }

          </Grid>

          {
          reviewerNames.users.length > 0 && (
            <Grid item xs={12} sx={{ mt: 1 }} display='flex'>
              <Typography sx={{ alignItems: 'center', fontWeight: 'bold', mr: 1 }} display='flex'>
                Users
              </Typography>
              <AvatarGroup max={maxVisibleUsers} onClick={() => setMaxVisibleUsers(maxVisibleUsers + defaultAvatarGroupIncrement)}>

                {
            reviewerNames.users.map(reviewer => {

              return (
                <Tooltip key={reviewer.id} title={reviewer.name}>
                  <Box>
                    <WorkspaceAvatar name={reviewer.name.slice(0, 2).match('0x') ? reviewer.name.slice(2, 3).toUpperCase() : reviewer.name.slice(0, 1).toUpperCase()} image={reviewer.profilePic as string} />
                  </Box>

                </Tooltip>
              );
            })
            }
              </AvatarGroup>
            </Grid>
          )
        }

          {
          reviewerNames.roles.length > 0 && (
          <Grid item xs={12} sx={{ mb: 4, mt: 3 }}>
            <Box display='flex'>
              <Typography sx={{ alignItems: 'center', fontWeight: 'bold', mr: 1 }} display='flex'>
                Roles
              </Typography>
              {
              reviewerNames.roles.map(reviewer => {
                return (
                  <Chip key={reviewer.id} label={reviewer.name} color='purple' sx={{ mr: 1 }} />
                );
              })
            }
            </Box>

            <AvatarGroup max={3}>

            </AvatarGroup>
          </Grid>
          )
        }
        </Grid>

        <Grid item xs={8}>
          <Typography variant='h5'>
            Submissions
            <Chip
              sx={{ ml: 1 }}
              label={`${bounty?.maxSubmissions ? `${validSubmissions} / ${bounty.maxSubmissions}` : validSubmissions}`}
            />

          </Typography>
        </Grid>
        <Grid container item xs={4} direction='row' justifyContent='flex-end'>
          {
            !bounty.approveSubmitters && !userSubmission && (
            <Tooltip placement='top' title={capReached ? `You cannot make a new submission to this bounty. The cap of ${bounty.maxSubmissions} submission${bounty.maxSubmissions !== 1 ? 's' : ''} has been reached.` : 'Submit your work to this bounty'}>
              <Box component='span'>
                <Button
                  disabled={!!userSubmission}
                  onClick={editSubmissionModal.open}
                >
                  New
                </Button>
              </Box>
            </Tooltip>
            )
          }
        </Grid>
        {
          !bounty.approveSubmitters && (
            <Grid item xs={12}>
              {humanisedSubmitterSentence.phrase}
            </Grid>
          )
        }

      </Grid>

      <Table stickyHeader sx={{ minWidth: 650 }} aria-label='bounty applicant table'>
        <TableHead sx={{
          background: theme.palette.background.dark,
          '.MuiTableCell-root': {
            background: theme.palette.settingsHeader.background
          }
        }}
        >
          <TableRow>
            {/* Width should always be same as Bounty Applicant list status column, so submitter and applicant columns align */}
            <TableCell sx={{ width: 120 }} align='left'>
              Status
            </TableCell>
            <TableCell>
              <Box sx={{
                display: 'flex',
                alignItems: 'center'
              }}
              >
                {/* <AutorenewIcon onClick={refreshsubmissions} /> */}
                Submitter
              </Box>
            </TableCell>
            <TableCell>
            </TableCell>
            {
              /* Hidden until we implement comments

            <TableCell>Last comment</TableCell>
              */
            }

            <TableCell align='right'>
              {isAdmin && <MultiPaymentModal bounties={[bounty]} />}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedSubmissions.map((submission, submissionIndex) => (
            <TableRow
              key={submission.id}
              sx={{ backgroundColor: submissionIndex % 2 !== 0 ? theme.palette.background.default : theme.palette.background.light, '&:last-child td, &:last-child th': { border: 0 } }}
              hover
            >
              <TableCell size='small' align='left'>
                <Box display='flex' gap={1}>
                  <Chip
                    label={SubmissionStatusLabels[submission.status]}
                    color={SubmissionStatusColors[submission.status]}
                  />
                </Box>
              </TableCell>
              <TableCell size='small'>
                {(() => {
                  const contributor = contributors.find(c => c.id === submission.createdBy);

                  if (contributor) {
                    return (
                      <UserDisplay
                        avatarSize='small'
                        user={contributor}
                        fontSize='small'
                        linkToProfile
                      />
                    );
                  }
                  return 'Anonymous';
                })()}
              </TableCell>
              <TableCell sx={{ maxWidth: '61vw', cursor: 'pointer' }} onClick={!(submission.status === 'review' && submission.createdBy === user?.id) ? () => setCurrentViewedSubmission(submission) : editSubmissionModal.open}>

                {
                    submission.status === 'review' && submission.createdBy === user?.id && (
                      <Typography
                        variant='body2'
                        color={theme.palette.primary?.main}
                      >
                        {fancyTrim(submission.submission ?? '', 50)}
                      </Typography>
                    )
                  }

                {
                  // Either another user is seeing this, or the user who made the submission, and they can't edit it further
                    ((submission.status !== 'review' && submission.createdBy === user?.id) || (submission.createdBy !== user?.id)) && (
                      <Typography
                        variant='body2'
                      >
                        {fancyTrim(submission.submission ?? '', 50)}
                      </Typography>
                    )
                  }

              </TableCell>

              {
                  /*
                  Hidden until we implement comments
                <TableCell align='right' sx={{ gap: 2 }}>
                </TableCell>
                  */
                }

              <TableCell align='right' sx={{ gap: 2, justifyContent: 'flex-end' }}>
                <BountySubmissionReviewActions
                  bounty={bounty}
                  submission={submission}
                  reviewComplete={refreshSubmissions}
                  onSubmission={editSubmissionModal.open}
                  permissions={permissions}
                />

              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {submissions?.length === 0 && (
        <Box
          my={3}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            opacity: 0.5
          }}
        >
          <Typography variant='h6'>
            No submissions
          </Typography>
        </Box>
      )}

      <Modal title='Your submission' open={editSubmissionModal.isOpen} onClose={editSubmissionModal.close} size='large'>
        <SubmissionEditorForm submission={userSubmission} bounty={bounty} onSubmit={submitterUpdatedSubmission} />
      </Modal>

      {
      /* Modal for viewing the content */
        <Modal open={currentViewedSubmission !== null} onClose={() => setCurrentViewedSubmission(null)} size='large'>
          <BountySubmissionContent submission={currentViewedSubmission as Application} />
        </Modal>
    }

    </Box>
  );
}
