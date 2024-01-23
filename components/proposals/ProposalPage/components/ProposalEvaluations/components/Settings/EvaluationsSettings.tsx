import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { Collapse } from '@mui/material';

import { useProposalTemplateById } from 'components/proposals/hooks/useProposalTemplates';
import type { ProposalEvaluationValues } from 'components/proposals/ProposalPage/components/ProposalEvaluations/components/Settings/components/EvaluationStepSettings';
import type { ProposalPropertiesInput } from 'components/proposals/ProposalPage/components/ProposalProperties/ProposalPropertiesBase';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import { WorkflowSelect } from '../../../WorkflowSelect';
import { EvaluationStepRow } from '../Review/components/EvaluationStepRow';

import { EvaluationStepSettings } from './components/EvaluationStepSettings';

export type Props = {
  proposal?: Pick<ProposalPropertiesInput, 'fields' | 'evaluations' | 'workflowId'>;
  onChangeEvaluation?: (evaluationId: string, updated: Partial<ProposalEvaluationValues>) => void;
  readOnly: boolean;
  isReviewer: boolean;
  onChangeWorkflow: (workflow: ProposalWorkflowTyped) => void;
  templateId?: string | null;
  requireWorkflowChangeConfirmation?: boolean;
  expanded: boolean;
};

export function EvaluationsSettings({
  proposal,
  onChangeEvaluation,
  readOnly,
  onChangeWorkflow,
  isReviewer,
  templateId,
  requireWorkflowChangeConfirmation,
  expanded: expandedContainer
}: Props) {
  const proposalTemplate = useProposalTemplateById(templateId);
  const pendingRewards = proposal?.fields?.pendingRewards;
  const { mappedFeatures } = useSpaceFeatures();
  const isAdmin = useIsAdmin();
  return (
    <div data-test='evaluation-settings-sidebar'>
      <Collapse in={expandedContainer}>
        <WorkflowSelect
          value={proposal?.workflowId}
          onChange={onChangeWorkflow}
          readOnly={!!templateId && !isAdmin}
          required
          requireConfirmation={requireWorkflowChangeConfirmation}
        />
      </Collapse>
      <EvaluationStepRow
        expanded={expandedContainer}
        expandedContainer={expandedContainer}
        index={0}
        result={null}
        title='Draft'
      />
      {proposal && (
        <>
          {proposal?.evaluations?.map((evaluation, index) => {
            // find matching template step, and allow editing if there were no reviewers set
            const matchingTemplateStep = proposalTemplate?.evaluations?.find((e) => e.title === evaluation.title);
            return (
              <EvaluationStepRow
                key={evaluation.id}
                expanded={expandedContainer}
                expandedContainer={expandedContainer}
                result={null}
                index={index + 1}
                title={evaluation.title}
              >
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
              expandedContainer={expandedContainer}
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
