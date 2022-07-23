import { useTheme } from '@emotion/react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Collapse, IconButton } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Application, ApplicationStatus, Bounty } from '@prisma/client';
import charmClient from 'charmClient';
import UserDisplay from 'components/common/UserDisplay';
import { useBounties } from 'hooks/useBounties';
import { useContributors } from 'hooks/useContributors';
import { useUser } from 'hooks/useUser';
import { ApplicationWithTransactions } from 'lib/applications/actions';
import { applicantIsSubmitter, countValidSubmissions } from 'lib/applications/shared';
import { AssignedBountyPermissions } from 'lib/bounties/interfaces';
import { humanFriendlyDate } from 'lib/utilities/dates';
import { useEffect, useState } from 'react';
import { BrandColor } from 'theme/colors';
import BountySubmissionReviewActions, { BountySubmissionReviewActionsProps } from '../../components/BountySubmissionReviewActions';
import { ApplicationEditorForm } from '../components/ApplicationEditorForm';
import BountyApplicationForm from './BountyApplicationForm';
import SubmissionEditorForm from './SubmissionEditorForm';

interface Props {
  bounty: Bounty
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
  bounty: Bounty
  onSubmission: BountySubmissionReviewActionsProps['onSubmission']
}

function BountySubmissionsTableRow ({ onSubmission, submission, permissions, bounty, totalAcceptedApplications }: BountySubmissionsTableRowProps) {
  const [contributors] = useContributors();
  const { refreshBounty } = useBounties();
  const [user] = useUser();
  const [isViewingDetails, setIsViewingDetails] = useState(false);

  const contributor = contributors.find(c => c.id === submission.createdBy);

  function displayAssignmentButton (application: Application) {
    return (
      // Only admins can approve applications for now
      (permissions.userPermissions.review)
      && application.status === 'applied'
      // If we reached the cap, we can't assign new people
      && (
        bounty.maxSubmissions === null || (
          totalAcceptedApplications < (bounty.maxSubmissions ?? 0)
        )
      ));
  }

  async function approveApplication (applicationId: string) {
    await charmClient.approveApplication(applicationId);
    refreshBounty(bounty.id);
  }

  return (
    <>
      <TableRow
        key={submission.id}
        hover
      >
        <TableCell size='small'>
          { contributor ? (
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
              setIsViewingDetails(!isViewingDetails);
            }}
          >
            {!isViewingDetails ? <KeyboardArrowDownIcon fontSize='small' /> : <KeyboardArrowUpIcon fontSize='small' />}
          </IconButton>
        </TableCell>
        <TableCell align='right' sx={{ gap: 2, justifyContent: 'flex-end' }}>
          {
          displayAssignmentButton(submission) === true ? (
            <Button
              sx={{ ml: 2 }}
              onClick={() => {
                approveApplication(submission.id);
              }}
            >
              Assign
            </Button>
          ) : (
            <BountySubmissionReviewActions
              bounty={bounty}
              submission={submission}
              reviewComplete={() => {}}
              onSubmission={onSubmission}
              permissions={permissions}
            />
          )
        }
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={isViewingDetails} timeout='auto' unmountOnExit>
            {submission.status !== 'applied' && submission.walletAddress && submission.submission && (
              <SubmissionEditorForm
                bountyId={bounty.id}
                readOnly={user?.id !== submission.createdBy || (submission.status !== 'inProgress' && submission.status !== 'review')}
                submission={submission}
                showHeader
              />
            )}
            <ApplicationEditorForm
              bountyId={bounty.id}
              proposal={submission}
              readOnly={user?.id !== submission.createdBy || submission.status !== 'applied'}
              mode='update'
              showHeader
            />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function BountySubmissionsTable ({ bounty, permissions }: Props) {
  const [user] = useUser();
  const theme = useTheme();

  const [submissions, setSubmissions] = useState<ApplicationWithTransactions[]>([]);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const { refreshBounty } = useBounties();

  const acceptedApplications = submissions.filter(applicantIsSubmitter);
  const userApplication = submissions.find(app => app.createdBy === user?.id);
  const validSubmissions = countValidSubmissions(submissions);

  async function refreshSubmissions () {
    if (bounty) {
      const foundSubmissions = await charmClient.listApplications(bounty.id);
      setSubmissions(foundSubmissions);
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
          {submissions.map((submission) => (
            <BountySubmissionsTableRow
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
      {submissions.length === 0 && permissions.userPermissions.review && (
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
        submissions={submissions}
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
