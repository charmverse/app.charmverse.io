import type { Space } from '@charmverse/core/prisma';
import { Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';

import {
  useGetProposalWorkflows,
  useUpsertProposalWorkflow,
  useDeleteProposalWorkflow
} from 'charmClient/hooks/spaces';
import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { getDefaultFeedbackEvaluation } from 'lib/proposal/workflows/defaultEvaluation';

import Legend from '../Legend';

import type { WorkflowTemplateFormItem } from './components/ProposalWorkflow';
import { ProposalWorkflowItem } from './components/ProposalWorkflow';

export function ProposalSettings({ space }: { space: Space }) {
  const isAdmin = useIsAdmin();
  const { mappedFeatures } = useSpaceFeatures();
  const [expanded, setExpanded] = useState<string | false>(false);
  const [workflows, setWorkflows] = useState<WorkflowTemplateFormItem[]>([]);
  const { data: currentWorkflowTemplates } = useGetProposalWorkflows(space.id);
  const { trigger: upsertWorkflow } = useUpsertProposalWorkflow(space.id);
  const { trigger: deleteWorkflow } = useDeleteProposalWorkflow(space.id);
  const { showMessage } = useSnackbar();

  useTrackPageView({ type: 'settings/proposals' });

  function addNewWorkflow(workflow?: WorkflowTemplateFormItem) {
    const lowestIndex = workflows[0]?.index ?? 0;
    const existingIndex = workflows.findIndex((e) => e.id === workflow?.id);
    const newWorkflow: WorkflowTemplateFormItem = {
      createdAt: new Date(),
      title: '',
      spaceId: space.id,
      evaluations: [getDefaultFeedbackEvaluation()],
      ...workflow,
      isNew: true,
      id: uuid(),
      index: lowestIndex - 1
    };
    // insert the new evaluation after the existing one
    if (existingIndex > -1) {
      workflows.splice(existingIndex + 1, 0, newWorkflow);
    } else {
      workflows.unshift(newWorkflow);
    }
    setWorkflows([...workflows]);
    setExpanded(newWorkflow.id);
  }

  async function handleSaveWorkflow({ isNew, ...workflow }: WorkflowTemplateFormItem) {
    await upsertWorkflow(workflow);
    handleUpdateWorkflow(workflow);
    setExpanded(false);
  }

  // updates the state but does not save to the backend
  async function handleUpdateWorkflow(workflow: WorkflowTemplateFormItem) {
    setWorkflows((_workflows) => _workflows.map((w) => (w.id === workflow.id ? workflow : w)));
  }

  async function handleDeleteWorkflow(id: string) {
    if (workflows.length === 1) {
      showMessage('You must have at least one workflow', 'error');
      return;
    }
    await deleteWorkflow({ workflowId: id });
    setWorkflows((_workflows) => _workflows.filter((workflow) => workflow.id !== id));
  }

  function handleCancelNewWorkflow(id: string) {
    setWorkflows((_workflows) => _workflows.filter((workflow) => workflow.id !== id));
  }

  function duplicateWorkflow(workflow: WorkflowTemplateFormItem) {
    addNewWorkflow({ ...workflow, title: `${workflow.title} (copy)` });
  }

  // set the workflow state on load - but from here on out the UI will maintain the latest 'state' since each row can be in an edited state at any given time
  useEffect(() => {
    if (currentWorkflowTemplates) {
      setWorkflows(currentWorkflowTemplates ?? []);
    }
  }, [!!currentWorkflowTemplates]);

  return (
    <>
      <Legend>{mappedFeatures.proposals.title}</Legend>
      <Typography variant='body1' gutterBottom>
        Workflows define how {mappedFeatures.proposals.title} are evaluated in this space.
      </Typography>
      <Legend display='flex' justifyContent='space-between' alignContent='flex-end'>
        <div>Workflows</div>
        <Tooltip title={!isAdmin ? 'Only space admins can create workflows' : ''} arrow>
          {/* Tooltip on disabled button requires one block element below wrapper */}
          <span>
            <Button size='small' id='add-invites-menu' onClick={() => addNewWorkflow()} disabled={!isAdmin}>
              New
            </Button>
          </span>
        </Tooltip>
      </Legend>
      {workflows.map((workflow, index) => (
        <ProposalWorkflowItem
          key={workflow.id}
          workflow={workflow}
          isExpanded={expanded === workflow.id}
          toggleRow={setExpanded}
          onSave={handleSaveWorkflow}
          onUpdate={handleUpdateWorkflow}
          onDelete={handleDeleteWorkflow}
          onCancel={handleCancelNewWorkflow}
          onDuplicate={duplicateWorkflow}
          readOnly={!isAdmin}
        />
      ))}
    </>
  );
}
