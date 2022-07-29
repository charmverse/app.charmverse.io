import { useTheme } from '@emotion/react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Collapse, IconButton, Stack, TextField } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { ApplicationStatus } from '@prisma/client';
import charmClient from 'charmClient';
import { createCommentBlock } from 'components/common/BoardEditor/focalboard/src/blocks/commentBlock';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import FieldLabel from 'components/common/form/FieldLabel';
import UserDisplay from 'components/common/UserDisplay';
import { useBounties } from 'hooks/useBounties';
import { useContributors } from 'hooks/useContributors';
import { useUser } from 'hooks/useUser';
import { ApplicationWithTransactions } from 'lib/applications/actions';
import { applicantIsSubmitter, countValidSubmissions } from 'lib/applications/shared';
import { AssignedBountyPermissions } from 'lib/bounties/interfaces';
import { humanFriendlyDate } from 'lib/utilities/dates';
import { BountyWithDetails } from 'models';
import { useEffect, useState } from 'react';
import { BrandColor } from 'theme/colors';
import BountySubmissionReviewActions, { BountySubmissionReviewActionsProps } from './BountySubmissionReviewActions';
import { ApplicationEditorForm } from '../[bountyId]/components/ApplicationEditorForm';
import BountyApplicationForm from './BountyApplicationForm';
import SubmissionEditorForm from '../[bountyId]/components_v3/SubmissionEditorForm';

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

interface BountySubmissionsTableRowProps {
  totalAcceptedApplications: number
  submission: ApplicationWithTransactions
  permissions: AssignedBountyPermissions
  bounty: BountyWithDetails
  onSubmission: BountySubmissionReviewActionsProps['onSubmission']
  onDetailsView: (isViewingDetails: boolean) => void
}

function BountySubmissionsTableRow ({
  onDetailsView,
  onSubmission,
  submission,
  permissions,
  bounty,
  totalAcceptedApplications
}:
  BountySubmissionsTableRowProps) {
  const [contributors] = useContributors();
  const [user] = useUser();
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const [applicationComment, setApplicationComment] = useState('');
  const contributor = contributors.find(c => c.id === submission.createdBy);

  const onSendClicked = () => {
    const comment = createCommentBlock();
    comment.parentId = bounty.page?.id;
    comment.rootId = bounty.page?.id;
    comment.title = `@${contributor?.username} ${applicationComment}`;
    mutator.insertBlock(comment, 'add comment');
  };

  return (
    <>
      <TableRow
        key={submission.id}
        hover
      >
        <TableCell size='small'>
          {contributor ? (
            <UserDisplay
              avatarSize='small'
              user={contributor}
              fontSize='small'
              linkToProfile
            />
          ) : 'Anonymous'}
        </TableCell>
        <TableCell size='small' align='left'>
          <Box display='flex' gap={1}>
            <Chip
              label={SubmissionStatusLabels[submission.status]}
              color={SubmissionStatusColors[submission.status]}
            />
          </Box>
        </TableCell>
        <TableCell>{humanFriendlyDate(submission.updatedAt, { withTime: true })}</TableCell>
        <TableCell>
          <IconButton
            size='small'
            onClick={() => {
              onDetailsView(isViewingDetails);
              setIsViewingDetails(!isViewingDetails);
            }}
          >
            {!isViewingDetails ? <KeyboardArrowDownIcon fontSize='small' /> : <KeyboardArrowUpIcon fontSize='small' />}
          </IconButton>
        </TableCell>
        <TableCell align='right' sx={{ gap: 2, justifyContent: 'flex-end' }}>
          <BountySubmissionReviewActions
            totalAcceptedApplications={totalAcceptedApplications}
            bounty={bounty}
            submission={submission}
            reviewComplete={() => { }}
            onSubmission={onSubmission}
            permissions={permissions}
            disableRejectButton
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ borderBottom: 0, padding: 0 }} colSpan={5}>
          <Collapse in={isViewingDetails} timeout='auto' unmountOnExit>
            {submission.status !== 'applied' && submission.walletAddress && submission.submission && (
              <SubmissionEditorForm
                bountyId={bounty.id}
                readOnly={user?.id !== submission.createdBy || (submission.status !== 'inProgress' && submission.status !== 'review')}
                submission={submission}
                showHeader
              />
            )}
            {bounty.approveSubmitters && (
              <ApplicationEditorForm
                bountyId={bounty.id}
                proposal={submission}
                readOnly={user?.id !== submission.createdBy || submission.status !== 'applied'}
                mode='update'
                showHeader
              />
            )}
            {permissions.userPermissions.review && submission.status !== 'rejected' && (
              <>
                <Stack mt={1}>
                  <FieldLabel>Message for Applicant (optional)</FieldLabel>
                  <Stack mb={1} flexDirection='row' gap={1}><TextField
                    value={applicationComment}
                    onChange={(e) => {
                      setApplicationComment(e.target.value);
                    }}
                    sx={{
                      flexGrow: 1
                    }}
                  />
                    <Button
                      disabled={applicationComment.length === 0}
                      onClick={() => {
                        setApplicationComment('');
                        onSendClicked();
                      }}
                    >Send
                    </Button>
                  </Stack>
                </Stack>
                <Box width='100%' display='flex' gap={1} my={2} justifyContent='center'>
                  <BountySubmissionReviewActions
                    totalAcceptedApplications={totalAcceptedApplications}
                    bounty={bounty}
                    submission={submission}
                    reviewComplete={() => { }}
                    onSubmission={onSubmission}
                    permissions={permissions}
                  />
                </Box>
              </>
            )}
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function BountySubmissionsTable ({ bounty, permissions }: Props) {
  const [user] = useUser();
  const theme = useTheme();
  const { refreshBounty } = useBounties();

  const [applications, setListApplications] = useState<ApplicationWithTransactions[]>([]);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const acceptedApplications = applications.filter(applicantIsSubmitter);
  const validSubmissions = countValidSubmissions(applications);
  const userApplication = applications.find(app => app.createdBy === user?.id);
  const isReviewer = permissions.userPermissions?.review;

  async function refreshSubmissions () {
    if (bounty) {
      const listApplicationsResponse = await charmClient.listApplications(bounty.id);
      setListApplications(listApplicationsResponse);
    }
  }

  useEffect(() => {
    refreshSubmissions();
  }, [bounty]);

  return (
    <Box>
      <Chip
        sx={{
          my: 1
        }}
        label={`Submissions: ${bounty?.maxSubmissions ? `${validSubmissions} / ${bounty.maxSubmissions}` : validSubmissions}`}
      />

      {(userApplication || permissions.userPermissions.review) && (
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
              <TableCell>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center'
                }}
                >
                  Applicant
                </Box>
              </TableCell>
              <TableCell sx={{ width: 120 }} align='left'>
                Status
              </TableCell>
              <TableCell>
                Last updated
              </TableCell>
              <TableCell>
              </TableCell>
              <TableCell align='center'>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(isReviewer ? applications : applications.filter(application => application.createdBy === user?.id)).map((submission) => (
              <BountySubmissionsTableRow
                onDetailsView={(isViewingDetails) => {
                  if (isViewingDetails) {
                    setIsSubmittingApplication(false);
                  }
                }}
                bounty={bounty}
                totalAcceptedApplications={acceptedApplications.length}
                permissions={permissions}
                submission={submission}
                key={submission.id}
                onSubmission={async () => {
                  setIsSubmittingApplication(true);
                }}
              />
            ))}
          </TableBody>
        </Table>
      )}
      {applications.length === 0 && permissions.userPermissions.review && (
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

      <BountyApplicationForm
        bounty={bounty}
        permissions={permissions}
        submissions={applications}
        refreshSubmissions={refreshSubmissions}
        validSubmissionsCount={validSubmissions}
      />

      {
        isSubmittingApplication && (
          <SubmissionEditorForm
            bountyId={bounty.id}
            submission={userApplication}
            showHeader
            onCancel={() => setIsSubmittingApplication(false)}
            onSubmit={async () => {
              await refreshSubmissions();
              await refreshBounty(bounty.id);
              setIsSubmittingApplication(false);
            }}
          />
        )
      }
    </Box>
  );
}
