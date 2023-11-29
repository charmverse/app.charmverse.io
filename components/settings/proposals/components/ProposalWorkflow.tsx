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
  TextField,
  Typography
} from '@mui/material';
import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import MultiTabs from 'components/common/MultiTabs';
import { useSnackbar } from 'hooks/useSnackbar';
import type { WorkflowTemplate, EvaluationTemplate } from 'lib/proposal/evaluationWorkflows';

import { EvaluationDialog } from './EvaluationDialog';
import { EvaluationRow } from './EvaluationRow';

export type WorkflowTemplateItem = WorkflowTemplate & { isNew?: boolean };

type EvaluationTemplateItem = Omit<EvaluationTemplate, 'id'> & { id: string | null };

export function ProposalWorkflowItem({
  isExpanded,
  toggleRow,
  workflow,
  onSave,
  onUpdate,
  onDuplicate,
  onDelete,
  readOnly
}: {
  isExpanded: boolean;
  toggleRow: (id: string | false) => void;
  workflow: WorkflowTemplateItem;
  onUpdate: (workflow: WorkflowTemplateItem) => void;
  onSave: (workflow: WorkflowTemplate) => void;
  onDelete: (id: string) => void;
  onDuplicate: (workflow: WorkflowTemplate) => void;
  readOnly: boolean;
}) {
  const [activeEvaluation, setActiveEvaluation] = useState<EvaluationTemplateItem | null>(null);
  const [hasUnsavedChanges, setUnsavedChanges] = useState(false);
  const { showMessage } = useSnackbar();
  const popupState = usePopupState({ variant: 'popover', popupId: `menu-${workflow.id}` });

  function duplicateWorkflow() {
    onDuplicate(workflow);
  }

  function deleteWorkflow() {
    onDelete(workflow.id);
  }

  function updateWorkflowTitle(title: string) {
    workflow.title = title;
    onUpdate(workflow);
    setUnsavedChanges(true);
  }

  async function changeEvaluationStepOrder(selectedId: string, targetId: string) {
    const newOrder = [...workflow.evaluations];
    const propIndex = newOrder.findIndex((val) => val.id === selectedId); // find the property that was dragged
    const deletedElements = newOrder.splice(propIndex, 1); // remove the dragged property from the array
    const droppedOnIndex = newOrder.findIndex((val) => val.id === targetId); // find the index of the space that was dropped on
    const newIndex = propIndex <= droppedOnIndex ? droppedOnIndex + 1 : droppedOnIndex; // if the dragged property was dropped on a space with a higher index, the new index needs to include 1 extra
    newOrder.splice(newIndex, 0, deletedElements[0]); // add the property to the new index
    workflow.evaluations = newOrder;
    onUpdate(workflow);
    setUnsavedChanges(true);
  }

  function addEvaluationStep(evaluation?: EvaluationTemplate) {
    const newEvaluation: EvaluationTemplateItem = {
      title: '',
      type: 'rubric',
      permissions: [],
      ...evaluation,
      id: null
    };
    setActiveEvaluation(newEvaluation);
  }

  function deleteEvaluationStep(id: string) {
    workflow.evaluations = workflow.evaluations.filter((evaluation) => evaluation.id !== id);
    onUpdate(workflow);
    setUnsavedChanges(true);
  }

  // note: this only updates the workflow state, does not save to the db
  function updateEvaluationStep(updates: EvaluationTemplate) {
    const index = workflow.evaluations.findIndex((e) => e.id === updates.id);
    if (index === -1) {
      workflow.evaluations.push(updates);
    } else {
      workflow.evaluations[index] = { ...workflow.evaluations[index], ...updates };
    }
    onUpdate(workflow);
    setUnsavedChanges(true);
  }

  function duplicateEvaluationStep(evaluation: EvaluationTemplate) {
    addEvaluationStep(evaluation);
  }

  function closeEvaluationStep() {
    setActiveEvaluation(null);
  }

  function openEvaluationStep(evaluation: EvaluationTemplate) {
    setActiveEvaluation(evaluation);
  }

  async function saveWorkflow() {
    try {
      await onSave(workflow);
      setUnsavedChanges(false);
    } catch (error) {
      showMessage('Error saving workflow', 'error');
    }
  }

  return (
    <Accordion
      key={workflow.id}
      expanded={isExpanded}
      onChange={(e, expand) => toggleRow(expand ? workflow.id : false)}
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box display='flex' alignItems='center' justifyContent='space-between' width='100%' gap={2}>
          {isExpanded && !readOnly ? (
            <TextField
              onClick={(e) => e.stopPropagation()}
              placeholder='Title (required)'
              // prevent the accordion summary styles from responding to 'focus' event
              onFocus={(e) => e.stopPropagation()}
              fullWidth
              autoFocus={workflow.isNew}
              defaultValue={workflow.title}
              onChange={(e) => updateWorkflowTitle(e.target.value)}
            />
          ) : (
            <Typography color={!workflow.title ? 'secondary' : 'inherit'}>{workflow.title || 'Untitled'}</Typography>
          )}
          {!readOnly && (
            <span onClick={(e) => e.stopPropagation()}>
              <Menu {...bindMenu(popupState)} onClick={popupState.close}>
                <MenuItem onClick={duplicateWorkflow}>
                  <ListItemText>Duplicate</ListItemText>
                </MenuItem>
                <MenuItem onClick={deleteWorkflow}>
                  <ListItemText>Delete</ListItemText>
                </MenuItem>
              </Menu>
              <Box display='flex' gap={2} alignItems='center'>
                {!isExpanded && hasUnsavedChanges && (
                  <Chip variant='outlined' size='small' color='warning' label='unsaved changes' />
                )}
                <IconButton size='small' {...bindTrigger(popupState)}>
                  <MoreHoriz fontSize='small' />
                </IconButton>
              </Box>
            </span>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <MultiTabs
          tabs={[
            [
              'Steps',
              <>
                {workflow.evaluations.map((evaluation) => (
                  <EvaluationRow
                    key={evaluation.id}
                    evaluation={evaluation}
                    onDelete={deleteEvaluationStep}
                    onDuplicate={duplicateEvaluationStep}
                    onRename={openEvaluationStep}
                    onChangeOrder={changeEvaluationStepOrder}
                    readOnly={readOnly}
                  />
                ))}
                <Button disabled={readOnly} variant='text' onClick={() => addEvaluationStep()}>
                  + Add step
                </Button>
              </>,
              { sx: { px: 0, pb: 0, pt: 2 } }
            ],
            ['Permissions', <div key='permissions'>Permissions!</div>, { sx: { px: 0, pb: 0, pt: 2 } }]
          ]}
        />
        <Box position='relative' mt={-4} display='flex' justifyContent='flex-end'>
          <Button disabled={readOnly} onClick={saveWorkflow} sx={{ opacity: hasUnsavedChanges ? 1 : 0 }}>
            Save
          </Button>
        </Box>

        <EvaluationDialog evaluation={activeEvaluation} onClose={closeEvaluationStep} onSave={updateEvaluationStep} />
      </AccordionDetails>
    </Accordion>
  );
}
