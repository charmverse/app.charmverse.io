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
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { v4 as uuid } from 'uuid';
import * as yup from 'yup';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { Button } from 'components/common/Button';
import { Dialog } from 'components/common/Dialog/Dialog';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { WorkflowTemplate, EvaluationTemplate } from 'lib/proposal/evaluationWorkflows';

import { EvaluationDialog } from './EvaluationDialog';
import { EvaluationRow } from './EvaluationRow';

export type WorkflowTemplateItem = WorkflowTemplate & { isNew?: boolean };

export const schema = yup.object({});

type FormValues = yup.InferType<typeof schema>;

type EvaluationTemplateItem = Omit<EvaluationTemplate, 'id'> & { id: string | null };

export function ProposalWorkflowItem({
  isExpanded,
  toggleRow,
  workflow,
  onSave: onSaveWorkflow,
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

  async function changeEvaluationsOrder(selectedId: string, targetId: string) {
    const newOrder = [...workflow.evaluations];
    const propIndex = newOrder.findIndex((val) => val.id === selectedId); // find the property that was dragged
    const deletedElements = newOrder.splice(propIndex, 1); // remove the dragged property from the array
    const droppedOnIndex = newOrder.findIndex((val) => val.id === targetId); // find the index of the space that was dropped on
    const newIndex = propIndex <= droppedOnIndex ? droppedOnIndex + 1 : droppedOnIndex; // if the dragged property was dropped on a space with a higher index, the new index needs to include 1 extra
    newOrder.splice(newIndex, 0, deletedElements[0]); // add the property to the new index
    workflow.evaluations = newOrder;
    onUpdate(workflow);
  }

  function addEvaluation(evaluation?: EvaluationTemplate) {
    const newEvaluation: EvaluationTemplateItem = {
      title: '',
      type: 'evaluation',
      permissions: [],
      ...evaluation,
      id: null
    };
    setActiveEvaluation(newEvaluation);
  }

  function deleteEvaluation(id: string) {
    workflow.evaluations = workflow.evaluations.filter((evaluation) => evaluation.id !== id);
    onDelete(workflow.id);
  }

  function saveEvaluation(updates: EvaluationTemplate) {
    const index = workflow.evaluations.findIndex((e) => e.id === updates.id);
    if (index === -1) {
      workflow.evaluations.push(updates);
    } else {
      workflow.evaluations[index] = { ...workflow.evaluations[index], ...updates };
    }
    onSaveWorkflow(workflow);
  }

  function duplicateEvaluation(evaluation: EvaluationTemplate) {
    addEvaluation(evaluation);
  }

  function closeEvaluation() {
    setActiveEvaluation(null);
  }

  function openEvaluation(evaluation: EvaluationTemplate) {
    setActiveEvaluation(evaluation);
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
            />
          ) : (
            <Typography color={!workflow.title ? 'secondary' : 'inherit'}>{workflow.title || 'Untitled'}</Typography>
          )}
          {!readOnly && (
            <span onClick={(e) => e.stopPropagation()}>
              <Menu {...bindMenu(popupState)}>
                <MenuItem onClick={duplicateWorkflow}>
                  <ListItemText>Duplicate</ListItemText>
                </MenuItem>
                <MenuItem onClick={deleteWorkflow}>
                  <ListItemText>Delete</ListItemText>
                </MenuItem>
              </Menu>
              <Box display='flex' gap={2} alignItems='center'>
                {!isExpanded && <Chip variant='outlined' size='small' color='warning' label='unsaved changes' />}
                <IconButton size='small' {...bindTrigger(popupState)}>
                  <MoreHoriz fontSize='small' />
                </IconButton>
              </Box>
            </span>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {workflow.evaluations.map((evaluation) => (
          <EvaluationRow
            key={evaluation.id}
            evaluation={evaluation}
            onDelete={deleteEvaluation}
            onDuplicate={duplicateEvaluation}
            onRename={openEvaluation}
            onSave={saveEvaluation}
            onChangeOrder={changeEvaluationsOrder}
            readOnly={readOnly}
          />
        ))}
        <Button disabled={readOnly} variant='text' onClick={() => addEvaluation()}>
          + Add step
        </Button>

        <EvaluationDialog evaluation={activeEvaluation} onClose={closeEvaluation} onSave={saveEvaluation} />
      </AccordionDetails>
    </Accordion>
  );
}
