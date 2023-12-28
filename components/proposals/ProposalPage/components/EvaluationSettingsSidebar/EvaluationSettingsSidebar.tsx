import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';

import type { ProposalEvaluationValues } from 'components/proposals/ProposalPage/components/EvaluationSettingsSidebar/components/EvaluationStepSettings';
import type { ProposalPropertiesInput } from 'components/proposals/ProposalPage/components/ProposalProperties/ProposalPropertiesBase';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { ProposalFields } from 'lib/proposal/blocks/interfaces';

import { EvaluationStepRow } from '../EvaluationSidebar/components/EvaluationStepRow';
import { WorkflowSelect } from '../WorkflowSelect';

import { EvaluationStepSettings } from './components/EvaluationStepSettings';

export type Props = {
  proposal?: Pick<ProposalPropertiesInput, 'categoryId' | 'fields' | 'evaluations' | 'workflowId'>;
  onChangeEvaluation?: (evaluationId: string, updated: Partial<ProposalEvaluationValues>) => void;
  readOnly: boolean;
  readOnlyReviewers: boolean;
  readOnlyRubricCriteria: boolean;
  onChangeWorkflow: (workflow: ProposalWorkflowTyped) => void;
  readOnlyWorkflowSelect?: boolean;
};

export function EvaluationSettingsSidebar({
  proposal,
  onChangeEvaluation,
  readOnly,
  readOnlyReviewers,
  readOnlyRubricCriteria,
  onChangeWorkflow,
  readOnlyWorkflowSelect
}: Props) {
  const pendingRewards = (proposal?.fields as ProposalFields)?.pendingRewards;
  const { mappedFeatures } = useSpaceFeatures();
  return (
    <div>
      <WorkflowSelect
        value={proposal?.workflowId}
        onChange={onChangeWorkflow}
        readOnly={readOnlyWorkflowSelect}
        required
      />
      <EvaluationStepRow position={1} result={null} title='Draft' />
      {proposal && (
        <>
          {proposal?.evaluations?.map((evaluation, index) => (
            <EvaluationStepRow key={evaluation.id} expanded result={null} position={index + 2} title={evaluation.title}>
              {/* <Divider sx={{ my: 1 }} /> */}
              <EvaluationStepSettings
                categoryId={proposal.categoryId}
                readOnly={readOnly}
                readOnlyReviewers={readOnlyReviewers}
                readOnlyRubricCriteria={readOnlyRubricCriteria}
                evaluation={evaluation}
                onChange={(updated) => {
                  onChangeEvaluation?.(evaluation.id, updated);
                }}
              />
            </EvaluationStepRow>
          ))}
          {pendingRewards?.length && (
            <EvaluationStepRow
              position={proposal ? proposal.evaluations.length + 2 : 0}
              result={null}
              title={mappedFeatures.rewards.title}
            />
          )}
        </>
      )}
    </div>
  );
}
