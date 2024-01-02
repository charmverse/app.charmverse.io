import type { ProposalEvaluation, ProposalSystemRole } from '@charmverse/core/prisma';
import { Box, Typography, FormLabel } from '@mui/material';

import { ProposalUserAndRoleSelect } from 'components/common/BoardEditor/components/properties/ProposalUserAndRoleSelect';
import type { SelectOption } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { allMembersSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import type { ProposalEvaluationInput } from 'lib/proposal/createProposal';

import { RubricCriteria } from './RubricCriteriaSettings';
import type { RangeProposalCriteria } from './RubricCriteriaSettings';
import { VoteSettings } from './VoteSettings';

// result and id are not used for creating evaluations, so add them here
// leave out permissions which are picked up on the backend based on workflowId
export type ProposalEvaluationValues = Omit<ProposalEvaluationInput, 'permissions'> &
  Pick<ProposalEvaluation, 'result' | 'id'>;

type Props = {
  evaluation: ProposalEvaluationValues;
  onChange: (criteria: Partial<ProposalEvaluationValues>) => void;
  readOnly: boolean;
  readOnlyReviewers: boolean;
  readOnlyRubricCriteria: boolean;
};

export function EvaluationStepSettings({
  evaluation,
  onChange,
  readOnly,
  readOnlyReviewers,
  readOnlyRubricCriteria
}: Props) {
  const reviewerOptions = evaluation.reviewers
    // .filter((reviewer) => reviewer.group === 'role' || reviewer.group === 'user')
    .map((reviewer) => ({
      group: reviewer.roleId ? 'role' : reviewer.userId ? 'user' : 'system_role',
      id: (reviewer.roleId ?? reviewer.userId ?? reviewer.systemRole) as string
    }));

  function handleOnChangeReviewers(reviewers: SelectOption[]) {
    onChange({
      reviewers: reviewers.map((r) => ({
        // id: r.group !== 'system_role' ? r.id : undefined, // system roles dont have ids
        // evaluationId: r.evaluationId,
        roleId: r.group === 'role' ? r.id : null,
        systemRole: r.group === 'system_role' ? (r.id as ProposalSystemRole) : null,
        userId: r.group === 'user' ? r.id : null
      }))
    });
  }

  return (
    <>
      <FormLabel required>
        <Typography component='span' variant='subtitle1'>
          {evaluation.type === 'vote' ? 'Voters' : 'Reviewers'}
        </Typography>
      </FormLabel>
      <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow' mb={2}>
        <ProposalUserAndRoleSelect
          data-test={`proposal-${evaluation.type}-select`}
          emptyPlaceholderContent='Select user or role'
          value={reviewerOptions as SelectOption[]}
          readOnly={readOnly || readOnlyReviewers}
          systemRoles={[allMembersSystemRole]}
          variant='outlined'
          onChange={handleOnChangeReviewers}
          required
        />
      </Box>
      {evaluation.type === 'rubric' && (
        <>
          <FormLabel required>
            <Typography component='span' variant='subtitle1'>
              Rubric criteria
            </Typography>
          </FormLabel>
          <Box display='flex' flex={1} flexDirection='column'>
            <RubricCriteria
              readOnly={readOnly || readOnlyRubricCriteria}
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
          readOnly={readOnly || readOnlyReviewers}
          value={evaluation.voteSettings}
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
