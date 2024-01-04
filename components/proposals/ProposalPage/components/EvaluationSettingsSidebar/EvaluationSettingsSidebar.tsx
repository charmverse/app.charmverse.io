import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';

import { useProposalTemplateById } from 'components/proposals/hooks/useProposalTemplates';
import type { ProposalEvaluationValues } from 'components/proposals/ProposalPage/components/EvaluationSettingsSidebar/components/EvaluationStepSettings';
import type { ProposalPropertiesInput } from 'components/proposals/ProposalPage/components/ProposalProperties/ProposalPropertiesBase';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import { EvaluationStepRow } from '../EvaluationSidebar/components/EvaluationStepRow';
import { WorkflowSelect } from '../WorkflowSelect';

import { EvaluationStepSettings } from './components/EvaluationStepSettings';

export type Props = {
  proposal?: Pick<ProposalPropertiesInput, 'fields' | 'evaluations' | 'workflowId'>;
  onChangeEvaluation?: (evaluationId: string, updated: Partial<ProposalEvaluationValues>) => void;
  readOnly: boolean;
  isReviewer: boolean;
  onChangeWorkflow: (workflow: ProposalWorkflowTyped) => void;
  templateId?: string | null;
};

export function EvaluationSettingsSidebar({
  proposal,
  onChangeEvaluation,
  readOnly,
  onChangeWorkflow,
  isReviewer,
  templateId
}: Props) {
  const proposalTemplate = useProposalTemplateById(templateId);
  const pendingRewards = proposal?.fields?.pendingRewards;
  const { mappedFeatures } = useSpaceFeatures();
  return (
    <div data-test='evaluation-settings-sidebar'>
      <WorkflowSelect value={proposal?.workflowId} onChange={onChangeWorkflow} readOnly={!!templateId} required />
      <EvaluationStepRow index={0} result={null} title='Draft' />
      {proposal && (
        <>
          {proposal?.evaluations?.map((evaluation, index) => {
            // find matching template step, and allow editing if there were no reviewers set
            const matchingTemplateStep = proposalTemplate?.evaluations?.find((e) => e.title === evaluation.title);
            return (
              <EvaluationStepRow key={evaluation.id} expanded result={null} index={index + 1} title={evaluation.title}>
                {/* <Divider sx={{ my: 1 }} /> */}
                {evaluation.type !== 'feedback' && (
                  <EvaluationStepSettings
                    evaluation={evaluation}
                    evaluationTemplate={matchingTemplateStep}
                    isReviewer={isReviewer}
                    readOnly={readOnly}
                    onChange={(updated) => {
                      onChangeEvaluation?.(evaluation.id, updated);
                    }}
                  />
                )}
              </EvaluationStepRow>
            );
          })}
          {!!pendingRewards?.length && (
            <EvaluationStepRow
              index={proposal ? proposal.evaluations.length + 1 : 0}
              result={null}
              title={mappedFeatures.rewards.title}
            />
          )}
        </>
      )}
    </div>
  );
}
