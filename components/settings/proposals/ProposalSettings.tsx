import type { Space } from '@charmverse/core/prisma';
import { Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';

import { useGetProposalWorkflowTemplates } from 'charmClient/hooks/spaces';
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
  const { data: currentWorkflowTemplates } = useGetProposalWorkflowTemplates(space.id);

  useTrackPageView({ type: 'settings/proposals' });

  function addNewWorkflow(workflow?: WorkflowTemplateItem) {
    const lowestIndex = workflows[0]?.index ?? 0;
    const newWorkflow: WorkflowTemplateItem = {
      title: '',
      spaceId: space.id,
      evaluations: [],
      ...workflow,
      isNew: true,
      id: uuid(),
      index: lowestIndex - 1
    };
    setWorkflows((_workflows) => [newWorkflow, ..._workflows]);
    setExpanded(newWorkflow.id);
  }

  function saveWorkflow(workflow: WorkflowTemplateItem) {
    updateWorkflow(workflow);
    triggerSave(workflow);
  }

  function updateWorkflow(workflow: WorkflowTemplateItem) {
    setWorkflows((_workflows) => _workflows.map((w) => (w.id === workflow.id ? workflow : w)));
  }

  function deleteWorkflow(id: string) {
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
          onSave={saveWorkflow}
          onUpdate={updateWorkflow}
          onDelete={deleteWorkflow}
          onDuplicate={duplicateWorkflow}
          readOnly={!isAdmin}
        />
      ))}
    </>
  );
}
