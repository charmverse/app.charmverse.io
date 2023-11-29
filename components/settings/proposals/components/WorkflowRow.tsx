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
  TextField,
  Typography
} from '@mui/material';
import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { v4 as uuid } from 'uuid';
import * as yup from 'yup';

import { Button } from 'components/common/Button';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { WorkflowTemplate, EvaluationStep } from 'lib/spaces/workflowTemplates';

import { WorkflowEvaluationRow } from './WorkflowEvaluationRow';

export type WorkflowTemplateItem = WorkflowTemplate & { isNew?: boolean };

export const schema = yup.object({});

type FormValues = yup.InferType<typeof schema>;

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

  function addEvaluation(evaluation?: EvaluationStep) {
    const existingIndex = workflow.evaluations.findIndex((e) => e.id === evaluation?.id);
    const newEvaluation: EvaluationStep = {
      title: '',
      type: 'vote',
      permissions: [],
      ...evaluation,
      id: uuid()
    };
    // insert the new evaluation after the existing one
    if (existingIndex > -1) {
      workflow.evaluations.splice(existingIndex + 1, 0, newEvaluation);
    } else {
      workflow.evaluations.push(newEvaluation);
    }
    onUpdate(workflow);
  }

  function deleteEvaluation(id: string) {
    workflow.evaluations = workflow.evaluations.filter((evaluation) => evaluation.id !== id);
    onDelete(workflow.id);
  }

  function saveEvaluation(evaluation: EvaluationStep) {
    workflow.evaluations = workflow.evaluations.map((e) => (e.id === evaluation.id ? evaluation : e));
    onSave(workflow);
  }

  function duplicateEvaluation(evaluation: EvaluationStep) {
    addEvaluation(evaluation);
  }

  function updateEvaluation(evaluation: EvaluationStep) {
    workflow.evaluations = workflow.evaluations.map((e) => (e.id === evaluation.id ? evaluation : e));
    onUpdate(workflow);
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
              autoFocus
              defaultValue={workflow.title}
            />
          ) : (
            <Typography>{workflow.title || 'Untitled'}</Typography>
          )}
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
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {workflow.evaluations.map((evaluation) => (
          <WorkflowEvaluationRow
            key={evaluation.id}
            evaluation={evaluation}
            onDelete={deleteEvaluation}
            onDuplicate={duplicateEvaluation}
            onSave={saveEvaluation}
            onChangeOrder={changeEvaluationsOrder}
            readOnly={readOnly}
          />
        ))}
        <Button variant='text' onClick={addEvaluation}>
          + Add step
        </Button>
      </AccordionDetails>
    </Accordion>
  );
}
