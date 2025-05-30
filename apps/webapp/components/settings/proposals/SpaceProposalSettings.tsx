import type { Space } from '@charmverse/core/prisma';
import { Box, Divider, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';

import {
  useGetProposalWorkflows,
  useUpsertProposalWorkflow,
  useDeleteProposalWorkflow
} from 'charmClient/hooks/spaces';
import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import Legend from '../components/Legend';

import type { WorkflowTemplateFormItem } from './components/ProposalWorkflow';
import { ProposalWorkflowItem } from './components/ProposalWorkflow';
import { RequireTemplatesForm } from './components/RequireTemplatesForm';

export function SpaceProposalSettings({ space }: { space: Space }) {
  const isAdmin = useIsAdmin();
  const { getFeatureTitle } = useSpaceFeatures();
  const [expanded, setExpanded] = useState<string | false>(false);
  const [workflows, setWorkflows] = useState<WorkflowTemplateFormItem[]>([]);
  const { data: currentWorkflowTemplates, isLoading: loadingWorkflows } = useGetProposalWorkflows(space.id);
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
      evaluations: [],
      ...workflow,
      isNew: true,
      id: uuid(),
      index: lowestIndex - 1,
      privateEvaluations: false,
      draftReminder: false,
      archived: false
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

  function handleCancelWorkflowChanges(id: string) {
    const currentWorkflow = currentWorkflowTemplates?.find((workflow) => workflow.id === id);
    if (currentWorkflow) {
      handleUpdateWorkflow({ ...currentWorkflow });
    } else {
      // if it is a new workflow, remove it
      setWorkflows((_workflows) => _workflows.filter((workflow) => workflow.id !== id));
    }
  }
  function duplicateWorkflow(workflow: WorkflowTemplateFormItem) {
    addNewWorkflow({ ...workflow, title: `${workflow.title} (copy)` });
  }

  // set the workflow state on load - but from here on out the UI will maintain the latest 'state' since each row can be in an edited state at any given time
  useEffect(() => {
    if (currentWorkflowTemplates) {
      setWorkflows([...currentWorkflowTemplates]);
    }
  }, [!!currentWorkflowTemplates]);

  return (
    <>
      <Legend>{getFeatureTitle('Proposals')}</Legend>
      <Typography variant='h6'>Workflows</Typography>
      <Box display='flex' justifyContent='space-between' mb={2}>
        <Typography variant='body1' gutterBottom>
          Workflows define how {getFeatureTitle('Proposals')} are evaluated in this space.
        </Typography>
        <Tooltip title={!isAdmin ? 'Only space admins can create workflows' : ''} arrow>
          {/* Tooltip on disabled button requires one block element below wrapper */}
          <span>
            <Button size='small' id='new-workflow-btn' onClick={() => addNewWorkflow()} disabled={!isAdmin}>
              New
            </Button>
          </span>
        </Tooltip>
      </Box>
      {loadingWorkflows && <LoadingComponent minHeight={200} />}
      <Box mb={2}>
        {workflows.map((workflow) => (
          <ProposalWorkflowItem
            key={workflow.id}
            workflow={workflow}
            isExpanded={expanded === workflow.id}
            toggleRow={setExpanded}
            onSave={handleSaveWorkflow}
            onUpdate={handleUpdateWorkflow}
            onDelete={handleDeleteWorkflow}
            onCancelChanges={handleCancelWorkflowChanges}
            onDuplicate={duplicateWorkflow}
            readOnly={!isAdmin}
            preventDelete={workflows.length === 1}
          />
        ))}
      </Box>
      <Typography variant='h6'>Templates</Typography>
      <RequireTemplatesForm />
    </>
  );
}
