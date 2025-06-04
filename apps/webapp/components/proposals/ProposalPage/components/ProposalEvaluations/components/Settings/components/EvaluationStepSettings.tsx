import type { ProposalEvaluation, ProposalEvaluationType, ProposalSystemRole } from '@charmverse/core/prisma';
import { Box, FormLabel, Switch, TextField, Typography } from '@mui/material';
import type { ProposalEvaluationInput } from '@packages/lib/proposals/createProposal';
import type { ConcealableEvaluationType, PopulatedEvaluation } from '@packages/lib/proposals/interfaces';
import { approvableEvaluationTypes } from '@packages/lib/proposals/workflows/constants';
import type { RangeProposalCriteria } from '@packages/lib/proposals/workflows/getNewCriteria';
import { DateTime } from 'luxon';
import { useEffect } from 'react';

import { useGetAllowedDocusignUsersAndRoles } from 'charmClient/hooks/docusign';
import type { SelectOption } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { DateTimePicker } from 'components/common/DateTimePicker';
import { FormControlLabel } from 'components/common/form/FormControlLabel';
import {
  allMembersSystemRole,
  authorSystemRole,
  tokenHoldersSystemRole
} from 'components/settings/proposals/components/EvaluationPermissions';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';

import { RubricCriteriaSettings } from './RubricCriteriaSettings';
import { VoteSettings } from './VoteSettings';

// result and id are not used for creating evaluations, so add them here
// leave out permissions which are picked up on the backend based on workflowId
export type ProposalEvaluationValues = Omit<ProposalEvaluationInput, 'permissions' | 'type'> & {
  type: ConcealableEvaluationType;
} & Pick<ProposalEvaluation, 'result' | 'id'>;

type Props = {
  evaluation: ProposalEvaluationValues;
  evaluationTemplate?: Pick<
    PopulatedEvaluation,
    | 'reviewers'
    | 'rubricCriteria'
    | 'voteSettings'
    | 'requiredReviews'
    | 'appealRequiredReviews'
    | 'appealReviewers'
    | 'evaluationApprovers'
    | 'appealable'
    | 'finalStep'
    | 'shareReviews'
  >;
  onChange: (criteria: Partial<ProposalEvaluationValues>) => void;
  readOnly: boolean;
  isPublishedProposal?: boolean;
};

export function EvaluationStepSettings({
  evaluation,
  evaluationTemplate,
  isPublishedProposal,
  onChange,
  readOnly
}: Props) {
  const isAdmin = useIsAdmin();
  const { space } = useCurrentSpace();

  // reviewers are also readOnly when using a template with reviewers pre-selected
  const readOnlyReviewers = readOnly || (!isAdmin && !!evaluationTemplate?.reviewers?.length);
  const readOnlyAppealReviewers = readOnly || (!isAdmin && !!evaluationTemplate?.appealReviewers?.length);
  // rubric criteria should also be editable by reviewers, and not if a template with rubric criteria was used
  const readOnlyRubricCriteria = readOnly || (!isAdmin && !!evaluationTemplate?.rubricCriteria.length);
  // rubric criteria should also be editable by reviewers, and not if a template with rubric criteria was used
  const readOnlyShareReviews = readOnly || (!isAdmin && !!evaluationTemplate);
  // vote settings are also readonly when using a template with vote settings pre-selected
  const readOnlyVoteSettings = readOnly || (!isAdmin && !!evaluationTemplate?.voteSettings);
  const readOnlyRequireReviews =
    isPublishedProposal || readOnly || (!isAdmin && !!evaluationTemplate?.requiredReviews) || !!evaluation.result;

  const reviewerOptions = evaluation.reviewers.map((reviewer) => ({
    group: reviewer.roleId ? 'role' : reviewer.userId ? 'user' : 'system_role',
    id: (reviewer.roleId ?? reviewer.userId ?? reviewer.systemRole) as string
  }));

  const approverOptions = evaluation.evaluationApprovers?.map((reviewer) => ({
    group: reviewer.roleId ? 'role' : 'user',
    id: (reviewer.roleId ?? reviewer.userId) as string
  }));

  const appealReviewerOptions =
    evaluation.appealReviewers?.map((reviewer) => ({
      group: reviewer.roleId ? 'role' : 'user',
      id: (reviewer.roleId ?? reviewer.userId) as string
    })) ?? [];
  const isTokenVoting = evaluation.type === 'vote' && evaluation.voteSettings?.strategy === 'token';
  const requiredReviews = evaluation.requiredReviews;
  const appealRequiredReviews = evaluation.appealRequiredReviews;
  const finalStep = evaluation.finalStep;

  const showApprovers = approvableEvaluationTypes.includes(evaluation.type as ProposalEvaluationType);

  const { data: allowedDocusignUsersAndRoles } = useGetAllowedDocusignUsersAndRoles({
    spaceId: evaluation.type === 'sign_documents' ? (space?.id as string) : null
  });

  const allowedUsersAndRoles = (allowedDocusignUsersAndRoles?.length ? allowedDocusignUsersAndRoles : null)?.map(
    (allowedUserOrRole) => {
      if (allowedUserOrRole.userId) {
        return {
          group: 'user',
          id: allowedUserOrRole.userId as string
        };
      }
      return {
        group: 'role',
        id: allowedUserOrRole.roleId as string
      };
    }
  );

  function handleOnChangeReviewers(reviewers: SelectOption[]) {
    onChange({
      reviewers: reviewers.map((r) => ({
        roleId: r.group === 'role' ? r.id : null,
        systemRole: r.group === 'system_role' ? (r.id as ProposalSystemRole) : null,
        userId: r.group === 'user' ? r.id : null
      }))
    });
  }

  function handleOnChangeAppealReviewers(reviewers: SelectOption[]) {
    onChange({
      appealReviewers: reviewers.map((r) => ({
        roleId: r.group === 'role' ? r.id : null,
        userId: r.group === 'user' ? r.id : null
      }))
    });
  }

  function handleOnChangeApprovers(approvers: SelectOption[]) {
    onChange({
      evaluationApprovers: approvers
        .map((a) => ({
          roleId: a.group === 'role' ? a.id : null,
          userId: a.group === 'user' ? a.id : null
        }))
        .filter((a) => a.userId || a.roleId)
    });
  }

  useEffect(() => {
    if (isTokenVoting) {
      handleOnChangeReviewers([tokenHoldersSystemRole]);
    }
  }, [isTokenVoting]);

  return (
    <>
      {/** Proposal reviewers */}
      <Box display='flex' flexDirection='column'>
        <FormLabel required>
          <Typography component='span' variant='subtitle1'>
            {evaluation.type === 'vote'
              ? 'Voters'
              : requiredReviews !== 1
                ? `Reviewers (required ${requiredReviews})`
                : 'Reviewers'}
          </Typography>
        </FormLabel>
        <Typography variant='caption'>Who can evaluate the proposal during this step</Typography>
      </Box>
      <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow' mb={2}>
        <UserAndRoleSelect
          data-test={`proposal-${evaluation.type}-select`}
          options={allowedUsersAndRoles}
          emptyPlaceholderContent='Select user or role'
          value={reviewerOptions as SelectOption[]}
          readOnly={readOnlyReviewers || isTokenVoting}
          systemRoles={
            evaluation.type === 'sign_documents'
              ? []
              : [authorSystemRole, isTokenVoting ? tokenHoldersSystemRole : allMembersSystemRole]
          }
          variant='outlined'
          onChange={handleOnChangeReviewers}
          required
        />
      </Box>
      {/** Proposal approvers - Can close out the current step */}
      {showApprovers && (
        <>
          <Box display='flex' flexDirection='column'>
            <FormLabel>
              <Typography component='span' variant='subtitle1'>
                Approvers
              </Typography>
            </FormLabel>
            <Typography variant='caption'>
              Who can move this proposal to the next step. Defaults to current reviewer if no user or role is selected
            </Typography>
          </Box>
          <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow' mb={2}>
            <UserAndRoleSelect
              data-test={`proposal-${evaluation.type}-approver-select`}
              options={allowedUsersAndRoles}
              emptyPlaceholderContent='Select user or role'
              value={approverOptions ?? []}
              readOnly={readOnlyReviewers}
              systemRoles={[]}
              variant='outlined'
              onChange={handleOnChangeApprovers}
            />
          </Box>
        </>
      )}
      {evaluation.type === 'pass_fail' && (
        <>
          <Box mb={2}>
            <FormControlLabel
              disabled={readOnlyShareReviews}
              control={
                <Switch
                  checked={!!evaluation.shareReviews}
                  onChange={async (ev) => {
                    onChange({ shareReviews: !!ev.target.checked });
                  }}
                />
              }
              label='Show reviews (anonymized)'
            />
          </Box>
          <Box mb={2}>
            <FormLabel>
              <Typography component='span' variant='subtitle1'>
                Required reviews
              </Typography>
            </FormLabel>
            <TextField
              placeholder='1'
              disabled={readOnlyRequireReviews}
              type='number'
              onChange={(e) => {
                onChange({
                  requiredReviews: Math.max(1, Number(e.target.value))
                });
              }}
              fullWidth
              value={requiredReviews}
            />
          </Box>
          {!!finalStep && <FormControlLabel disabled control={<Switch checked />} label='Priority Step' />}
          {evaluation.appealable && (
            <Box mb={2}>
              <FormLabel required={!!evaluation.appealable}>
                <Typography component='span' variant='subtitle1'>
                  {appealRequiredReviews && appealRequiredReviews !== 1
                    ? `Appeal Reviewers (required ${appealRequiredReviews})`
                    : 'Appeal Reviewers'}
                </Typography>
              </FormLabel>
              <Box display='flex' height='fit-content' flex={1}>
                <UserAndRoleSelect
                  emptyPlaceholderContent='Select appeal user or role'
                  value={appealReviewerOptions as SelectOption[]}
                  readOnly={readOnlyAppealReviewers || !evaluation.appealable}
                  variant='outlined'
                  onChange={handleOnChangeAppealReviewers}
                  required={!!evaluation.appealable}
                />
              </Box>
            </Box>
          )}
        </>
      )}
      {evaluation.type !== 'vote' && (
        <Box mb={2}>
          <Box display='flex' flexDirection='column' mb={1}>
            <FormLabel>
              <Typography component='span' variant='subtitle1'>
                Due date
              </Typography>
            </FormLabel>
            <Typography variant='caption'>Send a reminder 24 hrs to reviewers before the date</Typography>
          </Box>
          <DateTimePicker
            onAccept={(date) => {
              onChange({
                dueDate: date?.toJSDate() ?? null
              });
            }}
            sx={{
              width: '100%'
            }}
            minDate={DateTime.fromMillis(Date.now()).plus({ hour: 1 })}
            value={evaluation.dueDate ? DateTime.fromISO(evaluation.dueDate.toString()) : undefined}
            placeholder='N/A'
            views={['year', 'month', 'day', 'hours']}
          />
        </Box>
      )}
      {evaluation.type === 'rubric' && (
        <>
          <Box mb={2}>
            <FormControlLabel
              disabled={readOnlyShareReviews}
              control={
                <Switch
                  checked={!!evaluation.shareReviews}
                  onChange={async (ev) => {
                    onChange({ shareReviews: !!ev.target.checked });
                  }}
                />
              }
              label='Show reviews (anonymized)'
            />
          </Box>
          <FormLabel required>
            <Typography component='span' variant='subtitle1'>
              Rubric criteria
            </Typography>
          </FormLabel>
          <Box display='flex' flex={1} flexDirection='column'>
            <RubricCriteriaSettings
              readOnly={readOnlyRubricCriteria}
              showDeleteConfirmation={!!isPublishedProposal}
              value={evaluation.rubricCriteria as RangeProposalCriteria[]}
              onChange={(rubricCriteria) =>
                onChange({
                  rubricCriteria: rubricCriteria as ProposalEvaluationInput['rubricCriteria']
                })
              }
              answers={[]}
            />
          </Box>
        </>
      )}
      {evaluation.type === 'vote' && (
        <VoteSettings
          readOnly={readOnlyVoteSettings}
          value={evaluation.voteSettings}
          isPublishedProposal={isPublishedProposal}
          onChange={(voteSettings) =>
            onChange({
              voteSettings
            })
          }
        />
      )}
    </>
  );
}
