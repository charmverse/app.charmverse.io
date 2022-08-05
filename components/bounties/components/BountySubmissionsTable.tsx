import { useTheme } from '@emotion/react';
import { v4 as uuid } from 'uuid';
import { LockOpen } from '@mui/icons-material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LockIcon from '@mui/icons-material/Lock';
import { Collapse, IconButton, Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import Button from 'components/common/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { ApplicationStatus } from '@prisma/client';
import charmClient from 'charmClient';
import { createCommentBlock, CommentBlock } from 'components/common/BoardEditor/focalboard/src/blocks/commentBlock';
import { NewCommentInput } from 'components/common/BoardEditor/focalboard/src/components/cardDetail/commentsList';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import FieldLabel from 'components/common/form/FieldLabel';
import UserDisplay from 'components/common/UserDisplay';
import { useBounties } from 'hooks/useBounties';
import { useContributors } from 'hooks/useContributors';
import { useUser } from 'hooks/useUser';
import { ApplicationWithTransactions } from 'lib/applications/actions';
import { applicantIsSubmitter, countValidSubmissions, submissionsCapReached as submissionsCapReachedFn } from 'lib/applications/shared';
import { AssignedBountyPermissions } from 'lib/bounties/interfaces';
import { isBountyLockable } from 'lib/bounties/shared';
import { humanFriendlyDate } from 'lib/utilities/dates';
import { BountyWithDetails } from 'models';
import { useEffect, useState } from 'react';
import { BrandColor } from 'theme/colors';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { ApplicationEditorForm } from './BountyApplicantForm/components/ApplicationEditorForm';
import SubmissionEditorForm from './BountyApplicantForm/components/SubmissionEditorForm';
import BountySubmissionReviewActions from './BountySubmissionReviewActions';

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
  submissionsCapReached: boolean
  submission: ApplicationWithTransactions
  permissions: AssignedBountyPermissions
  bounty: BountyWithDetails
  refreshSubmissions: () => Promise<void>
}

function BountySubmissionsTableRow ({
  submission,
  permissions,
  bounty,
  submissionsCapReached,
  refreshSubmissions
}:
  BountySubmissionsTableRowProps) {
  const [contributors] = useContributors();
  const [user] = useUser();
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const contributor = contributors.find(c => c.id === submission.createdBy);
  const { refreshBounty } = useBounties();
  const [editorKey, setEditorKey] = useState(0); // a key to allow us to reset charmeditor contents

  const [defaultComment, setDefaultComment] = useState<CommentBlock['fields'] | null>(null);

  function onSendClicked (newComment: CommentBlock['fields']) {
    const comment = createCommentBlock();
    const { content, contentText } = newComment;
    comment.parentId = bounty.page.id;
    comment.rootId = bounty.page.id;
    comment.title = contentText || '';
    comment.fields = { content };
    mutator.insertBlock(comment, 'add comment');
    resetInput();
  }

  function resetInput () {
    if (user && contributor) {
      const content = getContentWithMention({ myUserId: user?.id, targetUserId: contributor?.id });
      setDefaultComment({ content });
    }
    else {
      setDefaultComment(null);
    }
    setEditorKey(key => key + 1);
  }

  useEffect(() => {
    resetInput();
  }, [user, contributor]);

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
              setIsViewingDetails(!isViewingDetails);
            }}
          >
            {!isViewingDetails ? <KeyboardArrowDownIcon fontSize='small' /> : <KeyboardArrowUpIcon fontSize='small' />}
          </IconButton>
        </TableCell>
        <TableCell align='right'>
          <Box display='flex' justifyContent='left' gap={2}>
            <BountySubmissionReviewActions
              bounty={bounty}
              submission={submission}
              reviewComplete={() => { }}
              permissions={permissions}
              submissionsCapReached={submissionsCapReached}
            />
          </Box>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ borderBottom: 0, padding: 0 }} colSpan={5}>
          <Collapse in={isViewingDetails} timeout='auto' unmountOnExit>
            {submission.status !== 'applied' && (
              <Box mb={3}>
                <SubmissionEditorForm
                  bountyId={bounty.id}
                  readOnly={user?.id !== submission.createdBy || (submission.status !== 'inProgress' && submission.status !== 'review')}
                  submission={submission}
                  onSubmit={async () => {
                    await refreshSubmissions();
                    await refreshBounty(bounty.id);
                    setIsViewingDetails(false);
                  }}
                  permissions={permissions}
                  expandedOnLoad={true}
                />
              </Box>
            )}
            {bounty.approveSubmitters && (
              <ApplicationEditorForm
                bountyId={bounty.id}
                proposal={submission}
                readOnly={user?.id !== submission.createdBy || submission.status !== 'applied'}
                mode='update'
              />
            )}

            {permissions.userPermissions.review && submission.status !== 'rejected' && submission.createdBy !== user?.id && (
              <>
                <Typography><strong>Message for Applicant (optional)</strong></Typography>
                <div className='CommentsList' style={{ paddingTop: 0 }}>
                  <NewCommentInput
                    initialValue={defaultComment}
                    key={editorKey}
                    username={user?.username}
                    avatar={user?.avatar}
                    onSubmit={onSendClicked}
                  />
                </div>
              </>
            )}
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function getContentWithMention ({ myUserId, targetUserId }: { myUserId: string, targetUserId: string }) {
  return {
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{
        type: 'mention',
        attrs: {
          id: uuid(),
          type: 'user',
          value: targetUserId,
          createdAt: new Date().toISOString(),
          createdBy: myUserId
        }
      }, {
        type: 'text',
        text: ' '
      }]
    }]
  };
}

export default function BountySubmissionsTable ({ bounty, permissions }: Props) {
  const theme = useTheme();

  const [applications, setListApplications] = useState<ApplicationWithTransactions[]>([]);
  const validSubmissions = countValidSubmissions(applications);
  const { refreshBounty } = useBounties();

  async function refreshSubmissions () {
    if (bounty) {
      const listApplicationsResponse = await charmClient.listApplications(bounty.id);
      setListApplications(listApplicationsResponse);
    }
  }

  const submissionsCapReached = submissionsCapReachedFn({
    bounty,
    submissions: applications
  });

  useEffect(() => {
    refreshSubmissions();
  }, [bounty]);

  async function lockBountySubmissions () {
    const updatedBounty = await charmClient.lockBountySubmissions(bounty!.id, !bounty.submissionsLocked);
    refreshBounty(updatedBounty.id);
  }

  return (
    <>
      <Box width='100%' display='flex' mb={1} justifyContent='space-between'>
        <Box display='flex' gap={1} alignItems='center'>
          <Chip
            sx={{
              my: 1
            }}
            label={`Submissions: ${bounty?.maxSubmissions ? `${validSubmissions} / ${bounty.maxSubmissions}` : validSubmissions}`}
          />
          { permissions?.userPermissions?.lock && isBountyLockable(bounty) && (
          <Tooltip key='stop-new' arrow placement='top' title={`${bounty.submissionsLocked ? 'Enable' : 'Prevent'} new ${bounty.approveSubmitters ? 'applications' : 'submissions'} from being made.`}>
            <IconButton
              size='small'
              onClick={() => {
                lockBountySubmissions();
              }}
            >
              { !bounty.submissionsLocked ? <LockOpen color='secondary' fontSize='small' /> : <LockIcon color='secondary' fontSize='small' />}
            </IconButton>
          </Tooltip>
          )}
        </Box>
      </Box>
      {
        applications.length === 0 ? (
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
        ) : (
          <Table stickyHeader sx={{ minWidth: 650 }} aria-label='bounty applicant table'>
            <TableHead sx={{
              background: theme.palette.background.dark,
              '.MuiTableCell-root': {
                background: theme.palette.settingsHeader.background
              }
            }}
            >
              <TableRow>
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
              {applications.map((submission) => (
                <BountySubmissionsTableRow
                  bounty={bounty}
                  permissions={permissions}
                  submission={submission}
                  key={submission.id}
                  refreshSubmissions={refreshSubmissions}
                  submissionsCapReached={submissionsCapReached}
                />
              ))}
            </TableBody>
          </Table>
        )
      }
    </>
  );
}
