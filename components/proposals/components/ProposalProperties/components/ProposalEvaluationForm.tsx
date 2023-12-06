import type { ProposalEvaluation } from '@charmverse/core/prisma';
import type { ProposalReviewerInput } from '@charmverse/core/proposals';
import { ExpandMore } from '@mui/icons-material';
import { Box, Divider, AccordionDetails, AccordionSummary } from '@mui/material';
import { useState } from 'react';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';

export type ProposalEvaluationInput = Pick<ProposalEvaluation, 'index' | 'title' | 'result' | 'id' | 'type'> & {
  reviewers: ProposalReviewerInput[];
};

type Props = {
  evaluation: ProposalEvaluationInput;
  categoryId?: string | null;
  onChange: (criteria: ProposalEvaluationInput) => void;
};

export function ProposalEvaluationForm({ evaluation, categoryId, onChange }: Props) {
  return (
    <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
      <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
        <PropertyLabel highlighted fullWidth>
          Evaluation step: {evaluation.title}
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
    </Box>
  );
}
