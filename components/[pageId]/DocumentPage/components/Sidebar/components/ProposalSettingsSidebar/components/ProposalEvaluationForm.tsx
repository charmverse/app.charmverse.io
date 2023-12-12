import type { ProposalEvaluation } from '@charmverse/core/prisma';
import { Box, Divider, Typography, FormLabel } from '@mui/material';

import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { ProposalRubricCriteriaInput } from 'components/proposals/components/ProposalProperties/components/ProposalRubricCriteriaInput';
import type { RangeProposalCriteria } from 'components/proposals/components/ProposalProperties/components/ProposalRubricCriteriaInput';
import { evaluationIcons } from 'components/settings/proposals/constants';
import type { ProposalEvaluationInput } from 'lib/proposal/createProposal';
import type { ProposalReviewerInput } from 'lib/proposal/interface';

// result and id are not used for creating evaluations, so add them here
// leave out permissions which are picked up on the backend based on workflowId
export type ProposalEvaluationValues = Omit<ProposalEvaluationInput, 'permissions'> &
  Pick<ProposalEvaluation, 'result' | 'id'>;

type Props = {
  evaluation: ProposalEvaluationValues;
  categoryId?: string | null;
  onChange: (criteria: ProposalEvaluationValues) => void;
};

export function ProposalEvaluationForm({ evaluation, categoryId, onChange }: Props) {
  return (
    <Box ml={3}>
      <Box display='flex' alignItems='center' gap={1} ml='-28px'>
        {evaluationIcons[evaluation.type]()}
        <Typography variant='h6'>{evaluation.title}</Typography>
      </Box>
      <Divider sx={{ my: 1 }} />
      <FormLabel required={evaluation.type !== 'vote'}>
        <Typography component='span' variant='subtitle1'>
          {evaluation.type === 'vote' ? 'Vote privileges' : 'Reviewer'}
        </Typography>
      </FormLabel>
      <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow' mb={2}>
        {evaluation.type === 'vote' ? (
          <Typography color='secondary' variant='caption'>
            Vote permissions are specified by Categories
          </Typography>
        ) : (
          <UserAndRoleSelect
            data-test='proposal-reviewer-select'
            emptyPlaceholderContent='Select user or role'
            value={evaluation.reviewers}
            variant='outlined'
            proposalCategoryId={categoryId}
            onChange={async (options) => {
              const reviewers = options.filter(
                (option) => option.group === 'role' || option.group === 'user'
              ) as ProposalReviewerInput[];
              onChange({
                ...evaluation,
                reviewers: reviewers.map((option) => ({ group: option.group, id: option.id }))
              });
            }}
          />
        )}
      </Box>
      {evaluation.type === 'rubric' && (
        <>
          <FormLabel required>
            <Typography component='span' variant='subtitle1'>
              Rubric criteria
            </Typography>
          </FormLabel>
          <Box display='flex' flex={1} flexDirection='column'>
            <ProposalRubricCriteriaInput
              value={evaluation.rubricCriteria as RangeProposalCriteria[]}
              onChange={(rubricCriteria) =>
                onChange({
                  ...evaluation,
                  rubricCriteria: rubricCriteria as ProposalEvaluationInput['rubricCriteria']
                })
              }
              answers={[]}
            />
          </Box>
        </>
      )}
    </Box>
  );
}
