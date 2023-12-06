import type { ProposalEvaluation } from '@charmverse/core/prisma';
import type { ProposalReviewerInput } from '@charmverse/core/proposals';
import { Box, Typography } from '@mui/material';
import type { Theme } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { evaluationIcons } from 'components/settings/proposals/constants';

import { ProposalRubricCriteriaInput } from './ProposalRubricCriteriaInput';
import type { RangeProposalCriteria } from './ProposalRubricCriteriaInput';

export type ProposalEvaluationInput = Pick<ProposalEvaluation, 'index' | 'title' | 'result' | 'id' | 'type'> & {
  reviewers: ProposalReviewerInput[];
  rubricCriteria: RangeProposalCriteria[];
};

type Props = {
  evaluation: ProposalEvaluationInput;
  categoryId?: string | null;
  onChange: (criteria: ProposalEvaluationInput) => void;
};

export function ProposalEvaluationForm({ evaluation, categoryId, onChange }: Props) {
  const isMobile = useMediaQuery<Theme>((theme) => theme.breakpoints.down('sm'));
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
                value={evaluation.rubricCriteria}
                onChange={(rubricCriteria) => onChange({ ...evaluation, rubricCriteria })}
                answers={[]}
              />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
