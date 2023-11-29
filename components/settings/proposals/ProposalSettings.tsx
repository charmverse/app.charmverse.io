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
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import Legend from '../Legend';

import type { WorkflowTemplateItem } from './components/WorkflowRow';
import { ProposalWorkflowItem } from './components/WorkflowRow';

export function ProposalSettings({ space }: { space: Space }) {
  const isAdmin = useIsAdmin();
  const { mappedFeatures } = useSpaceFeatures();
  const [expanded, setExpanded] = useState<string | false>(false);
  const [workflows, setWorkflows] = useState<WorkflowTemplateItem[]>([]);
  const { data: currentWorkflowTemplates } = useGetProposalWorkflows(space.id);
  const { trigger: upsertWorkflow } = useUpsertProposalWorkflow(space.id);
  const { trigger: deleteWorkflow } = useDeleteProposalWorkflow(space.id);

  useTrackPageView({ type: 'settings/proposals' });

  function addNewWorkflow(workflow?: WorkflowTemplateItem) {
    const lowestIndex = workflows[0]?.index ?? 0;
    const existingIndex = workflows.findIndex((e) => e.id === workflow?.id);
    const newWorkflow: WorkflowTemplateItem = {
      title: '',
      spaceId: space.id,
      evaluations: [],
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

  async function handleSaveWorkflow(workflow: WorkflowTemplateItem) {
    await upsertWorkflow(workflow);
    handleUpdateWorkflow(workflow);
  }

  // updates the state but does not save to the backend
  async function handleUpdateWorkflow(workflow: WorkflowTemplateItem) {
    setWorkflows((_workflows) => _workflows.map((w) => (w.id === workflow.id ? workflow : w)));
  }

  async function handleDeleteWorkflow(id: string) {
    await deleteWorkflow({ workflowId: id });
    setWorkflows((_workflows) => _workflows.filter((workflow) => workflow.id !== id));
  }

  function duplicateWorkflow(workflow: WorkflowTemplateItem) {
    addNewWorkflow(workflow);
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
            <Button id='add-invites-menu' onClick={() => addNewWorkflow()} disabled={!isAdmin}>
              Add
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
          onDuplicate={duplicateWorkflow}
          readOnly={!isAdmin}
        />
      ))}
    </>
  );
}
