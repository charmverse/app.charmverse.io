import { Box, Collapse, FormLabel, Tooltip, Typography } from '@mui/material';
import { cloneDeep } from 'lodash';
import { useState } from 'react';

import { useGetRewardWorkflows } from 'charmClient/hooks/rewards';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import LoadingComponent from 'components/common/LoadingComponent';
import { EvaluationStepRow } from 'components/common/workflows/EvaluationStepRow';
import { WorkflowSelect } from 'components/common/workflows/WorkflowSelect';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { getRewardWorkflow } from 'lib/rewards/getRewardWorkflow';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import type { RewardEvaluation } from 'pages/api/spaces/[id]/rewards/workflows';

import type { EvaluationSettingsProps } from '../Settings/EvaluationsSettings';

import { EvaluationStepActions } from './components/EvaluationStepActions';

export type Props = Omit<
  EvaluationSettingsProps,
  'onChangeWorkflow' | 'requireWorkflowChangeConfirmation' | 'rewardInput'
> & {
  reward?: RewardWithUsers;
};

export function EvaluationsReview({ reward, onChangeEvaluation, expanded: expandedContainer, readOnly }: Props) {
  const { space: currentSpace } = useCurrentSpace();
  const { data: workflowOptions = [] } = useGetRewardWorkflows(currentSpace?.id);
  const workflow = getRewardWorkflow(workflowOptions, reward);
  const [_expandedEvaluationId, setExpandedEvaluationId] = useState<string | undefined>(undefined);
  const [evaluationInput, setEvaluationInput] = useState<RewardEvaluation | null>(null);

  function openSettings(evaluation: RewardEvaluation) {
    // use clone deep to avoid changing deeply-nested objects like rubric criteria
    setEvaluationInput(cloneDeep(evaluation));
  }

  const expandedEvaluationId = expandedContainer && _expandedEvaluationId;

  return (
    <LoadingComponent isLoading={!reward}>
      <Collapse in={expandedContainer}>
        <Tooltip title='Workflow can only be changed in Draft step'>
          <span>
            <WorkflowSelect options={workflowOptions} value={workflow?.id} readOnly />
          </span>
        </Tooltip>
      </Collapse>
      {workflow?.evaluations.map((evaluation, index) => {
        return (
          <EvaluationStepRow
            key={evaluation.id}
            expanded={evaluation.id === expandedEvaluationId}
            expandedContainer={expandedContainer}
            isCurrent={false}
            onChange={(e, expand) => setExpandedEvaluationId(expand ? evaluation.id : undefined)}
            index={index}
            title={evaluation.title}
            result={null}
            actions={
              evaluation.type === 'apply' ? null : (
                <EvaluationStepActions canEdit={!readOnly} openSettings={() => openSettings(evaluation)} />
              )
            }
          >
            {evaluation.type === 'application_review' || evaluation.type === 'review' ? (
              <Box mb={2}>
                <FormLabel>
                  <Typography sx={{ mb: 1 }} variant='subtitle1'>
                    Reviewers
                  </Typography>
                </FormLabel>
                <UserAndRoleSelect
                  data-test='evaluation-reviewer-select'
                  readOnly={true}
                  value={reward?.reviewers ?? []}
                  onChange={() => {}}
                />
              </Box>
            ) : null}
          </EvaluationStepRow>
        );
      })}
    </LoadingComponent>
  );
}
