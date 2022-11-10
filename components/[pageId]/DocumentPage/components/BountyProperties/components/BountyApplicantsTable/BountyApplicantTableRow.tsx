
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Alert, Card, Collapse, FormLabel, IconButton, Box, Tooltip, TableCell, TableRow, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';

import charmClient from 'charmClient';
import type { CommentBlock } from 'components/common/BoardEditor/focalboard/src/blocks/commentBlock';
import { createCommentBlock } from 'components/common/BoardEditor/focalboard/src/blocks/commentBlock';
import { NewCommentInput } from 'components/common/BoardEditor/focalboard/src/components/cardDetail/commentsList';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import Button from 'components/common/Button';
import Link from 'components/common/Link';
import Modal from 'components/common/Modal';
import UserDisplay from 'components/common/UserDisplay';
import { useBounties } from 'hooks/useBounties';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type { ApplicationWithTransactions } from 'lib/applications/actions';
import type { ReviewDecision, SubmissionReview } from 'lib/applications/interfaces';
import type { AssignedBountyPermissions, BountyWithDetails } from 'lib/bounties';
import { humanFriendlyDate } from 'lib/utilities/dates';
import type { SystemError } from 'lib/utilities/errors';

import ApplicationInput from '../BountyApplicantForm/components/ApplicationInput';
import SubmissionInput from '../BountyApplicantForm/components/SubmissionInput';
import BountyApplicantStatus from '../BountyApplicantStatus';

import BountyApplicantActions from './BountyApplicantActions';

interface Props {
  submissionsCapReached: boolean;
  submission: ApplicationWithTransactions;
  permissions: AssignedBountyPermissions;
  bounty: BountyWithDetails;
  refreshSubmissions: () => Promise<void>;
}

export default function BountyApplicantTableRow ({
  submission,
  permissions,
  bounty,
  submissionsCapReached,
  refreshSubmissions
}: Props) {
  const { members } = useMembers();
  const { user } = useUser();
  const [isExpandedRow, setIsExpandedRow] = useState(false);
  const member = members.find(c => c.id === submission.createdBy);
  const { refreshBounty } = useBounties();
  const [editorKey, setEditorKey] = useState(0); // a key to allow us to reset charmeditor contents

  const [defaultComment, setDefaultComment] = useState<CommentBlock['fields'] | null>(null);
  const [reviewDecision, setReviewDecision] = useState<SubmissionReview | null>(null);
  const [apiError, setApiError] = useState<SystemError | null>();

  const showAcceptApplication = submission.status === 'applied';

  // We can only review or accept application. These are mutually exclusive.
  const showAcceptSubmission = !showAcceptApplication && submission.status === 'review' && submission.createdBy !== user?.id;

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
    if (user && member) {
      const content = getContentWithMention({ myUserId: user?.id, targetUserId: member?.id });
      setDefaultComment({ content });
    }
    else {
      setDefaultComment(null);
    }
    setEditorKey(key => key + 1);
  }

  async function approveApplication (applicationId: string) {
    if (!submissionsCapReached) {
      await charmClient.bounties.approveApplication(applicationId);
      refreshBounty(bounty.id);
    }
  }

  function makeSubmissionDecision (applicationId: string, decision: ReviewDecision) {
    setApiError(null);
    charmClient.bounties.reviewSubmission(applicationId, decision)
      .then(() => {
        // Closes the modal
        setReviewDecision(null);
        refreshBounty(bounty.id);
      })
      .catch(err => {
        setApiError(err);
      });
  }

  function cancel () {
    setReviewDecision(null);
    setApiError(null);
  }

  useEffect(() => {
    resetInput();
  }, [user, member]);

  return (
    <>
      <TableRow
        key={submission.id}
        hover
        sx={{ '.MuiTableCell-root': { borderBottom: 0 } }}
      >
        <TableCell size='small'>
          {member ? (
            <UserDisplay
              avatarSize='small'
              user={member}
              fontSize='small'
              linkToProfile
            />
          ) : 'Anonymous'}
        </TableCell>
        <TableCell>
          <BountyApplicantStatus submission={submission} />
        </TableCell>
        <TableCell>{humanFriendlyDate(submission.updatedAt, { withTime: true })}</TableCell>
        <TableCell>
          <Tooltip title={isExpandedRow ? 'Hide details' : 'View details'}>
            <IconButton
              size='small'
              onClick={() => {
                setIsExpandedRow(!isExpandedRow);
              }}
            >
              {!isExpandedRow ? <KeyboardArrowDownIcon fontSize='small' /> : <KeyboardArrowUpIcon fontSize='small' />}
            </IconButton>
          </Tooltip>
        </TableCell>
        <TableCell align='right'>
          <BountyApplicantActions
            bounty={bounty}
            isExpanded={isExpandedRow}
            submission={submission}
            expandRow={() => setIsExpandedRow(true)}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ p: 0 }} colSpan={5}>
          <Collapse in={isExpandedRow} timeout='auto' unmountOnExit>
            <Box p={2} pt={0}>
              {bounty.approveSubmitters && (
                <Box mb={2}>
                  <ApplicationInput
                    bountyId={bounty.id}
                    alwaysExpanded={!submission.submission}
                    proposal={submission}
                    readOnly={user?.id !== submission.createdBy || submission.status !== 'applied'}
                    mode='update'
                  />
                  {
                    showAcceptApplication && (
                      <Box display='flex' gap={1} mb={3}>
                        <Tooltip title={submissionsCapReached ? 'Submissions cap reached' : ''}>
                          <Button
                            disabled={submissionsCapReached}
                            color='primary'
                            onClick={() => {
                              approveApplication(submission.id);
                            }}
                          >
                            Accept application
                          </Button>
                        </Tooltip>
                        <Button
                          color='error'
                          variant='outlined'
                          disabled={submission.status === 'inProgress'}
                          onClick={() => setReviewDecision({ submissionId: submission.id, decision: 'reject', userId: user?.id as string })}
                        >
                          Reject
                        </Button>
                      </Box>
                    )
                  }
                </Box>
              )}
              {submission.submission && (
                <Box mb={2}>
                  <SubmissionInput
                    bountyId={bounty.id}
                    readOnly={user?.id !== submission.createdBy || (submission.status !== 'inProgress' && submission.status !== 'review')}
                    submission={submission}
                    onSubmit={async () => {
                      await refreshSubmissions();
                      await refreshBounty(bounty.id);
                      setIsExpandedRow(false);
                    }}
                    permissions={permissions}
                    expandedOnLoad={submission.status === 'review'}
                    alwaysExpanded={false}
                  />
                  {/* disabled - maybe we dont need to show address here? <Box mb={3}>
                    <Typography variant='body2'>
                      Payment address:
                      {submission.walletAddress ? (
                        <Link
                          external
                          target='_blank'
                          href={`https://etherscan.io/address/${submission.walletAddress}`}
                        >
                          {` ${shortenHex(submission.walletAddress)} `}
                          <OpenInNewIcon sx={{ fontSize: 14 }} />
                        </Link>
                      ) : <strong>{' Not set'}</strong>}
                    </Typography>
                  </Box> */}
                  {
                    showAcceptSubmission && (
                      <Box display='flex' gap={1} mb={3}>
                        <Button
                          color='primary'
                          disabled={submission.status === 'inProgress'}
                          onClick={() => {
                            setReviewDecision({ decision: 'approve', submissionId: submission.id, userId: user?.id as string });
                          }}
                        >
                          Approve submission
                        </Button>
                        <Button
                          color='error'
                          variant='outlined'
                          disabled={submission.status === 'inProgress'}
                          onClick={() => setReviewDecision({ submissionId: submission.id, decision: 'reject', userId: user?.id as string })}
                        >
                          Reject
                        </Button>

                      </Box>
                    )
                  }
                </Box>
              )}

              {submission.status !== 'rejected' && submission.createdBy !== user?.id && (
                <>
                  <FormLabel><strong>Send a message (optional)</strong></FormLabel>
                  <div className='CommentsList' style={{ padding: 0 }}>
                    <NewCommentInput
                      $key={editorKey}
                      key={editorKey}
                      initialValue={defaultComment}
                      username={user?.username}
                      avatar={user?.avatar}
                      onSubmit={onSendClicked}
                    />
                  </div>
                </>
              )}
            </Box>

            {/* Modal which provides review confirmation */}
            <Modal title='Confirm your review' open={reviewDecision !== null} onClose={cancel} size='large'>

              {reviewDecision?.decision === 'approve' ? (
                <Typography sx={{ mb: 1, whiteSpace: 'pre' }}>
                  Please confirm you want to <b>approve</b> this submission.
                </Typography>
              ) : (
                <Box>
                  <Typography sx={{ mb: 1, whiteSpace: 'pre' }}>
                    Please confirm you want to <b>reject</b> this submission.
                  </Typography>
                  <Typography sx={{ mb: 1, whiteSpace: 'pre' }}>
                    The submitter will be disqualified from making further changes
                  </Typography>
                </Box>
              )}

              <Typography>
                This decision is permanent.
              </Typography>

              {apiError && (
                <Alert sx={{ mt: 2, mb: 2 }} severity={apiError.severity}>
                  {apiError.message}
                </Alert>
              )}

              <Box display='flex' gap={2} mt={3}>
                {reviewDecision?.decision === 'approve' && (
                  <Button
                    color='primary'
                    onClick={() => makeSubmissionDecision(reviewDecision.submissionId, 'approve')}
                  >
                    Approve submission
                  </Button>
                )}

                {reviewDecision?.decision === 'reject' && (
                  <Button
                    color='error'
                    onClick={() => makeSubmissionDecision(reviewDecision.submissionId, 'reject')}
                  >
                    Reject submission
                  </Button>
                )}

                <Button variant='outlined' color='secondary' onClick={cancel}>Cancel</Button>
              </Box>
            </Modal>
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
