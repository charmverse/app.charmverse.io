import { Box, Card, Typography } from '@mui/material';

import type { ProposalEvaluationValues } from 'components/proposals/ProposalPage/components/EvaluationSettingsSidebar/components/EvaluationSettings';
import type { ProposalPropertiesInput } from 'components/proposals/ProposalPage/components/ProposalProperties/ProposalPropertiesBase';
import { useIsAdmin } from 'hooks/useIsAdmin';

import { ProposalSidebarHeader } from '../EvaluationSidebar/components/ProposalSidebarHeader';

import { EvaluationSettings } from './components/EvaluationSettings';

export type Props = {
  proposal?: Pick<ProposalPropertiesInput, 'categoryId' | 'evaluations'>;
  onChangeEvaluation?: (evaluationId: string, updated: Partial<ProposalEvaluationValues>) => void;
  goToEvaluation: (evaluationId?: string) => void;
  readOnly: boolean;
  showHeader: boolean;
  readOnlyReviewers: boolean;
  readOnlyRubricCriteria: boolean;
};

export function EvaluationSettingsSidebar({
  proposal,
  showHeader,
  goToEvaluation,
  onChangeEvaluation,
  readOnly,
  readOnlyReviewers,
  readOnlyRubricCriteria
}: Props) {
  const evaluationsWithConfig = proposal?.evaluations.filter((e) => e.type !== 'feedback');

  return (
    <>
      {showHeader && (
        <ProposalSidebarHeader
          evaluations={proposal?.evaluations || []}
          goToEvaluation={goToEvaluation}
          goToSettings={() => undefined}
        />
      )}
      <Box display='flex' flex={1} flexDirection='column'>
        {proposal &&
          evaluationsWithConfig?.map((evaluation) => (
            <Card key={evaluation.id} variant='outlined' sx={{ p: 1, mb: 2 }}>
              <EvaluationSettings
                categoryId={proposal.categoryId}
                readOnly={readOnly}
                readOnlyReviewers={readOnlyReviewers}
                readOnlyRubricCriteria={readOnlyRubricCriteria}
                evaluation={evaluation}
                onChange={(updated) => {
                  onChangeEvaluation?.(evaluation.id, updated);
                }}
              />
            </Card>
          ))}
        {proposal && evaluationsWithConfig?.length === 0 && (
          <Typography variant='body2' color='secondary'>
            No evaluations configured
          </Typography>
        )}
      </Box>
    </>
  );
}
