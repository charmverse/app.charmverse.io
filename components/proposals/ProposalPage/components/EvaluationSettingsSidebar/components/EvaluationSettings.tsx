import type { ProposalEvaluation, ProposalSystemRole } from '@charmverse/core/prisma';
import { Box, Divider, Typography, FormLabel } from '@mui/material';

import type { SelectOption } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { allMembersSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import { evaluationIcons } from 'components/settings/proposals/constants';
import type { ProposalEvaluationInput } from 'lib/proposal/createProposal';

import { RubricCriteria } from './RubricCriteria';
import type { RangeProposalCriteria } from './RubricCriteria';
import { VoteSettings } from './VoteSettings';

// result and id are not used for creating evaluations, so add them here
// leave out permissions which are picked up on the backend based on workflowId
export type ProposalEvaluationValues = Omit<ProposalEvaluationInput, 'permissions'> &
  Pick<ProposalEvaluation, 'result' | 'id'>;

type Props = {
  evaluation: ProposalEvaluationValues;
  categoryId?: string | null;
  onChange: (criteria: Partial<ProposalEvaluationValues>) => void;
  readOnly: boolean;
  readOnlyReviewers: boolean;
};

export function EvaluationSettings({ evaluation, categoryId, onChange, readOnly, readOnlyReviewers }: Props) {
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
    <Box ml={3}>
      <Box display='flex' alignItems='center' gap='5px' ml='-25px'>
        {evaluationIcons[evaluation.type]()}
        <Typography variant='h6'>{evaluation.title}</Typography>
      </Box>
      <Divider sx={{ my: 1 }} />
      <FormLabel required={evaluation.type !== 'vote'}>
        <Typography component='span' variant='subtitle1'>
          {evaluation.type === 'vote' ? 'Voter' : 'Reviewer'}
        </Typography>
      </FormLabel>
      <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow' mb={2}>
        <UserAndRoleSelect
          data-test='proposal-reviewer-select'
          emptyPlaceholderContent='Select user or role'
          value={reviewerOptions}
          readOnly={readOnly || readOnlyReviewers}
          systemRoles={[allMembersSystemRole]}
          variant='outlined'
          proposalCategoryId={categoryId}
          onChange={handleOnChangeReviewers}
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
              readOnly={readOnly}
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
        <>
          {/* <FormLabel required>
            <Typography component='span' variant='subtitle1'>
              Vote settings
            </Typography>
          </FormLabel> */}
          {/* <Box display='flex' flex={1} flexDirection='column'> */}
          <VoteSettings
            readOnly={readOnly}
            value={evaluation.voteSettings}
            onChange={(voteSettings) =>
              onChange({
                voteSettings
              })
            }
          />
          {/* </Box> */}
        </>
      )}
    </Box>
  );
}
