import type { Space } from '@charmverse/core/prisma';
import { Box, Divider, Tooltip, Typography, Alert } from '@mui/material';
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';

import {
  useDeleteProposalWorkflow,
  useGetProposalWorkflows,
  useUpsertProposalWorkflow
} from 'charmClient/hooks/spaces';
import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { useWorkflowAccess } from 'hooks/useWorkflowAccess';

import Legend from '../components/Legend';

import type { WorkflowTemplateFormItem } from './components/ProposalWorkflow';
import { ProposalWorkflowItem } from './components/ProposalWorkflow';
import { RequireTemplatesForm } from './components/RequireTemplatesForm';

export function SpaceProposalSettings({ space }: { space: Space }) {
  const isAdmin = useIsAdmin();
  const { getFeatureTitle } = useSpaceFeatures();
  const [expanded, setExpanded] = useState<string | false>(false);
  const [workflows, setWorkflows] = useState<WorkflowTemplateFormItem[]>([]);
  const {
    data: currentWorkflowTemplates,
    isLoading: loadingWorkflows,
    mutate: refreshWorkflows
  } = useGetProposalWorkflows(space.id);
  const { trigger: upsertWorkflow } = useUpsertProposalWorkflow(space.id);
  const { trigger: deleteWorkflow } = useDeleteProposalWorkflow(space.id);
  const { showMessage } = useSnackbar();
  const { canCreateWorkflow } = useWorkflowAccess();

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
    if (workflows.filter((w) => !w.archived).length === 1) {
      showMessage('You must have at least one active workflow', 'error');
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
    addNewWorkflow({ ...workflow, title: `${workflow.title} (copy)`, archived: false });
  }

  // set the workflow state on load - but from here on out the UI will maintain the latest 'state' since each row can be in an edited state at any given time
  useEffect(() => {
    if (currentWorkflowTemplates) {
      setWorkflows([...currentWorkflowTemplates]);
    }
  }, [!!currentWorkflowTemplates]);

  // Separate active and archived workflows
  const activeWorkflows = workflows.filter((workflow) => !workflow.archived);
  const archivedWorkflows = workflows.filter((workflow) => workflow.archived);

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
            <Button
              size='small'
              id='new-workflow-btn'
              onClick={() => addNewWorkflow()}
              disabled={!isAdmin || !canCreateWorkflow}
              disabledTooltip={
                !canCreateWorkflow ? 'You have reached the maximum number of workflows for your subscription tier' : ''
              }
            >
              New
            </Button>
          </span>
        </Tooltip>
      </Box>
      {loadingWorkflows && <LoadingComponent minHeight={200} />}
      <Box mb={2}>
        {activeWorkflows.map((workflow) => (
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
            preventDelete={activeWorkflows.length === 1}
            refreshWorkflows={refreshWorkflows}
          />
        ))}
      </Box>

      {archivedWorkflows.length > 0 && (
        <>
          <Box mt={4} mb={2}>
            <Divider />
            <Typography variant='h6' color='textSecondary' sx={{ mt: 2 }}>
              Archived Workflows
            </Typography>
            {isAdmin && (
              <Alert severity='info' sx={{ my: 1 }}>
                After upgrading your subscription, you'll need to manually unarchive any token gates, roles, or
                workflows that you want to keep using. Any proposal templates using an archived workflow will be hidden
                until the workflow is unarchived or deleted.
              </Alert>
            )}
          </Box>
          <Box mb={2}>
            {archivedWorkflows.map((workflow) => (
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
                preventDelete={false}
                refreshWorkflows={refreshWorkflows}
              />
            ))}
          </Box>
        </>
      )}

      <Typography variant='h6'>Templates</Typography>
      <RequireTemplatesForm />
    </>
  );
}
