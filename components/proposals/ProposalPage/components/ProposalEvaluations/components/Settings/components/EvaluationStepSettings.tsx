import type { ProposalEvaluation, ProposalSystemRole } from '@charmverse/core/prisma';
import { Box, Typography, FormLabel, TextField } from '@mui/material';
import { useEffect } from 'react';

import type { SelectOption } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import {
  authorSystemRole,
  allMembersSystemRole,
  tokenHoldersSystemRole
} from 'components/settings/proposals/components/EvaluationPermissions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import type { ProposalEvaluationInput } from 'lib/proposals/createProposal';
import type { PopulatedEvaluation } from 'lib/proposals/interfaces';
import type { RangeProposalCriteria } from 'lib/proposals/workflows/getNewCriteria';

import { RubricCriteriaSettings } from './RubricCriteriaSettings';
import { VoteSettings } from './VoteSettings';

// result and id are not used for creating evaluations, so add them here
// leave out permissions which are picked up on the backend based on workflowId
export type ProposalEvaluationValues = Omit<ProposalEvaluationInput, 'permissions'> &
  Pick<ProposalEvaluation, 'result' | 'id'>;

type Props = {
  evaluation: ProposalEvaluationValues;
  evaluationTemplate?: Pick<PopulatedEvaluation, 'reviewers' | 'rubricCriteria' | 'voteSettings' | 'requiredReviews'>;
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
  // reviewers are also readOnly when using a template with reviewers pre-selected
  const readOnlyReviewers = readOnly || (!isAdmin && !!evaluationTemplate?.reviewers?.length);
  // rubric criteria should also be editable by reviewers, and not if a template with rubric critera was used
  const readOnlyRubricCriteria = readOnly || (!isAdmin && !!evaluationTemplate?.rubricCriteria.length);
  // vote settings are also readonly when using a template with vote settings pre-selected
  const readOnlyVoteSettings = readOnly || (!isAdmin && !!evaluationTemplate?.voteSettings);
  const readOnlyRequireReviews = readOnly || !!evaluationTemplate?.requiredReviews || !!evaluation.result;
  const reviewerOptions = evaluation.reviewers.map((reviewer) => ({
    group: reviewer.roleId ? 'role' : reviewer.userId ? 'user' : 'system_role',
    id: (reviewer.roleId ?? reviewer.userId ?? reviewer.systemRole) as string
  }));
  const isTokenVoting = evaluation.type === 'vote' && evaluation.voteSettings?.strategy === 'token';
  const requiredReviews = evaluation.requiredReviews;
  function handleOnChangeReviewers(reviewers: SelectOption[]) {
    onChange({
      reviewers: reviewers.map((r) => ({
        roleId: r.group === 'role' ? r.id : null,
        systemRole: r.group === 'system_role' ? (r.id as ProposalSystemRole) : null,
        userId: r.group === 'user' ? r.id : null
      }))
    });
  }

  useEffect(() => {
    if (isTokenVoting) {
      handleOnChangeReviewers([tokenHoldersSystemRole]);
    }
  }, [isTokenVoting]);

  return (
    <>
      <FormLabel required>
        <Typography component='span' variant='subtitle1'>
          {evaluation.type === 'vote'
            ? 'Voters'
            : requiredReviews !== 1
            ? `Reviewers (required ${requiredReviews})`
            : 'Reviewers'}
        </Typography>
      </FormLabel>
      <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow' mb={2}>
        <UserAndRoleSelect
          data-test={`proposal-${evaluation.type}-select`}
          emptyPlaceholderContent='Select user or role'
          value={reviewerOptions as SelectOption[]}
          readOnly={readOnlyReviewers || isTokenVoting}
          systemRoles={[authorSystemRole, isTokenVoting ? tokenHoldersSystemRole : allMembersSystemRole]}
          variant='outlined'
          onChange={handleOnChangeReviewers}
          required
        />
      </Box>
      {evaluation.type === 'pass_fail' && (
        <Box className='octo-propertyrow'>
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
      )}
      {evaluation.type === 'rubric' && (
        <>
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
