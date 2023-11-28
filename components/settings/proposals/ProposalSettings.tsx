import type { Space } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import { ExpandMore, MoreHoriz } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography
} from '@mui/material';
import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { v4 as uuid } from 'uuid';
import * as yup from 'yup';

import { useGetProposalWorkflowTemplates } from 'charmClient/hooks/spaces';
import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { WorkflowTemplate } from 'lib/spaces/getProposalWorkflowTemplates';

import Legend from '../Legend';

export const schema = yup.object({});

type FormValues = yup.InferType<typeof schema>;

type WorkflowTemplateItem = WorkflowTemplate & { isNew?: boolean };

export function ProposalSettings({ space }: { space: Space }) {
  const isAdmin = useIsAdmin();
  const { mappedFeatures } = useSpaceFeatures();
  const [expanded, setExpanded] = useState<string | false>(false);
  const [workflows, setWorkflows] = useState<WorkflowTemplateItem[]>([]);
  const { data: currentWorkflowTemplates } = useGetProposalWorkflowTemplates(space.id);

  useTrackPageView({ type: 'settings/proposals' });

  function addNewWorkflow(workflow?: WorkflowTemplate) {
    const lowestIndex = workflows[0]?.index ?? 0;
    const newWorkflow: WorkflowTemplateItem = {
      id: uuid(),
      isNew: true,
      title: '',
      spaceId: space.id,
      evaluations: [],
      ...workflow,
      index: lowestIndex - 1
    };
    setWorkflows((_workflows) => [newWorkflow, ..._workflows]);
    setExpanded(newWorkflow.id);
  }

  function saveWorkflow(workflow: WorkflowTemplate) {}

  function deleteWorkflow(id: string) {
    setWorkflows((_workflows) => _workflows.filter((workflow) => workflow.id !== id));
  }

  function duplicateWorkflow(workflow: WorkflowTemplate) {
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
      <Legend>{mappedFeatures.proposals.title} Settings</Legend>
      <Typography variant='body1' gutterBottom>
        Customize the steps to evaluate {mappedFeatures.proposals.title} in this space.
      </Typography>
      <Legend display='flex' justifyContent='space-between' alignContent='flex-end'>
        <div>Workflow templates</div>
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
          onDelete={deleteWorkflow}
          onDuplicate={duplicateWorkflow}
        />
      ))}
    </>
  );
}

function ProposalWorkflowItem({
  isExpanded,
  toggleRow,
  workflow,
  onSave,
  onDuplicate,
  onDelete
}: {
  isExpanded: boolean;
  toggleRow: (id: string | false) => void;
  workflow: WorkflowTemplateItem;
  onSave: (workflow: WorkflowTemplate) => void;
  onDelete: (id: string) => void;
  onDuplicate: (workflow: WorkflowTemplate) => void;
}) {
  const popupState = usePopupState({ variant: 'popover', popupId: `menu-${workflow.id}` });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty, isSubmitting }
  } = useForm<FormValues>({
    mode: 'onChange',
    resolver: yupResolver(schema)
  });

  function duplicateWorkflow() {
    onDuplicate(workflow);
    popupState.close();
  }

  function deleteWorkflow() {
    onDelete(workflow.id);
    popupState.close();
  }

  return (
    <Accordion
      key={workflow.id}
      expanded={isExpanded}
      onChange={(e, expand) => toggleRow(expand ? workflow.id : false)}
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box display='flex' justifyContent='space-between' width='100%'>
          <Box display='flex' gap={2} alignItems='center'>
            <Typography>Workflow {workflow.index}</Typography>
            {!isExpanded && <Chip variant='outlined' size='small' color='warning' label='unsaved changes' />}
          </Box>
          <span onClick={(e) => e.stopPropagation()}>
            <Menu {...bindMenu(popupState)}>
              <MenuItem onClick={duplicateWorkflow}>
                <ListItemText>Duplicate</ListItemText>
              </MenuItem>
              <MenuItem onClick={deleteWorkflow}>
                <ListItemText>Delete</ListItemText>
              </MenuItem>
            </Menu>
            <IconButton size='small' {...bindTrigger(popupState)}>
              <MoreHoriz fontSize='small' />
            </IconButton>
          </span>
        </Box>
      </AccordionSummary>
      <AccordionDetails></AccordionDetails>
    </Accordion>
  );
}
