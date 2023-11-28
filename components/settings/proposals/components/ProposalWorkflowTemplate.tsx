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

import { Button } from 'components/common/Button';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { WorkflowTemplate } from 'lib/spaces/getProposalWorkflowTemplates';

export type WorkflowTemplateItem = WorkflowTemplate & { isNew?: boolean };

export const schema = yup.object({});

type FormValues = yup.InferType<typeof schema>;

export function ProposalWorkflowItem({
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
