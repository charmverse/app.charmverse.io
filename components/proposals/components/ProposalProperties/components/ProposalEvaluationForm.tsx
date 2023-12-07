import type { ProposalEvaluation } from '@charmverse/core/prisma';
import type { ProposalReviewerInput } from '@charmverse/core/proposals';
import { Box } from '@mui/material';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { evaluationIcons } from 'components/settings/proposals/constants';
import type { ProposalEvaluationInput } from 'lib/proposal/createProposal';

import { ProposalRubricCriteriaInput } from './ProposalRubricCriteriaInput';
import type { RangeProposalCriteria } from './ProposalRubricCriteriaInput';

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
    <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
      <Box display='flex' alignItems='center' gap={1}>
        {evaluationIcons[evaluation.type]()}
        <PropertyLabel highlighted fullWidth>
          {evaluation.title}
        </PropertyLabel>
      </Box>
      <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
        <PropertyLabel readOnly required>
          Reviewer
        </PropertyLabel>
        <UserAndRoleSelect
          data-test='proposal-reviewer-select'
          value={evaluation.reviewers}
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
      </Box>
      {evaluation.type === 'rubric' && (
        <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
          <Box
            display='flex'
            height='fit-content'
            flex={1}
            className='octo-propertyrow'
            flexDirection={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch !important', sm: 'flex-start' }}
          >
            <PropertyLabel required>Criteria</PropertyLabel>
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
          </Box>
        </Box>
      )}
    </Box>
  );
}
