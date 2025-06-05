import type { ProposalWorkflowTyped, WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { Archive, ContentCopyOutlined, DeleteOutlined, ExpandMore, MoreHoriz, Unarchive } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  Chip,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { getDefaultEvaluation } from '@packages/lib/proposals/workflows/defaultEvaluation';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { useArchiveProposalWorkflow, useUnarchiveProposalWorkflow } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import { VisibilityIcon } from 'components/common/Icons/VisibilityIcon';
import MultiTabs from 'components/common/MultiTabs';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWorkflowAccess } from 'hooks/useWorkflowAccess';

import type { EvaluationTemplateFormItem } from './EvaluationDialog';
import { EvaluationDialog } from './EvaluationDialog';
import { EvaluationNotificationsRow } from './EvaluationNotifications';
import { EvaluationPermissionsRow } from './EvaluationPermissions';
import { EvaluationRow } from './EvaluationRow';

export type WorkflowTemplateFormItem = ProposalWorkflowTyped & { isNew?: boolean };

export function ProposalWorkflowItem({
  isExpanded,
  toggleRow,
  workflow,
  onSave,
  onUpdate,
  onDuplicate,
  onDelete,
  onCancelChanges,
  readOnly,
  preventDelete,
  refreshWorkflows
}: {
  refreshWorkflows: () => void;
  isExpanded: boolean;
  toggleRow: (id: string | false) => void;
  workflow: WorkflowTemplateFormItem;
  onUpdate: (workflow: WorkflowTemplateFormItem) => void;
  onSave: (workflow: ProposalWorkflowTyped) => void;
  onDelete: (id: string) => void;
  onCancelChanges: (id: string) => void;
  onDuplicate: (workflow: ProposalWorkflowTyped) => void;
  readOnly: boolean;
  preventDelete: boolean;
}) {
  const [activeEvaluation, setActiveEvaluation] = useState<EvaluationTemplateFormItem | null>(null);
  const [hasUnsavedChanges, setUnsavedChanges] = useState(!!workflow.isNew);
  const { showMessage } = useSnackbar();
  const popupState = usePopupState({ variant: 'popover', popupId: `menu-${workflow.id}` });
  const { trigger: archiveWorkflow } = useArchiveProposalWorkflow(workflow.spaceId);
  const { trigger: unarchiveWorkflow } = useUnarchiveProposalWorkflow(workflow.spaceId);
  const { canCreateWorkflow } = useWorkflowAccess();

  // Make workflow readonly if it's archived or if readOnly prop is true
  const isReadOnly = !!(readOnly || workflow.archived);

  function duplicateWorkflow() {
    onDuplicate(workflow);
  }

  function deleteWorkflow() {
    onDelete(workflow.id);
  }

  async function toggleArchiveWorkflow() {
    try {
      if (workflow.archived) {
        await unarchiveWorkflow({ workflowId: workflow.id });
      } else {
        await archiveWorkflow({ workflowId: workflow.id });
      }
      refreshWorkflows();
      onUpdate({ ...workflow, archived: !workflow.archived });
      showMessage(`Workflow ${workflow.archived ? 'unarchived' : 'archived'} successfully`);
    } catch (error) {
      showMessage(
        (error as Error).message || `Failed to ${workflow.archived ? 'unarchive' : 'archive'} workflow`,
        'error'
      );
    }
  }

  function cancelChanges() {
    setUnsavedChanges(false);
    onCancelChanges(workflow.id);
  }

  function updateWorkflowTitle(title: string) {
    onUpdate({ ...workflow, title });
    setUnsavedChanges(true);
  }

  function updateDraftReminder(draftReminder: boolean) {
    onUpdate({ ...workflow, draftReminder });
    setUnsavedChanges(true);
  }

  function updatePrivateEvaluations(privateEvaluations: boolean) {
    onUpdate({ ...workflow, privateEvaluations });
    setUnsavedChanges(true);
  }

  function changeEvaluationStepOrder(
    { id: selectedId }: WorkflowEvaluationJson,
    { id: targetId }: WorkflowEvaluationJson
  ) {
    const newOrder = [...workflow.evaluations];
    const propIndex = newOrder.findIndex((val) => val.id === selectedId); // find the property that was dragged
    const deletedElements = newOrder.splice(propIndex, 1); // remove the dragged property from the array
    const droppedOnIndex = newOrder.findIndex((val) => val.id === targetId); // find the index of the space that was dropped on
    const newIndex = propIndex <= droppedOnIndex ? droppedOnIndex + 1 : droppedOnIndex; // if the dragged property was dropped on a space with a higher index, the new index needs to include 1 extra
    newOrder.splice(newIndex, 0, deletedElements[0]); // add the property to the new index
    workflow.evaluations = newOrder;
    onUpdate({ ...workflow, evaluations: newOrder });
    setUnsavedChanges(true);
  }

  function openNewEvaluationStepModal(evaluation?: WorkflowEvaluationJson) {
    const newEvaluation = getDefaultEvaluation(evaluation);
    setActiveEvaluation({
      ...newEvaluation,
      id: null
    });
  }

  function deleteEvaluationStep(id: string) {
    const evaluations = workflow.evaluations.filter((evaluation) => evaluation.id !== id);
    onUpdate({ ...workflow, evaluations });
    setUnsavedChanges(true);
  }

  // note: this only updates the workflow state, does not save to the db
  function updateEvaluationStep(updates: WorkflowEvaluationJson) {
    const index = workflow.evaluations.findIndex((e) => e.id === updates.id);
    const evaluations = [...workflow.evaluations];
    if (index === -1) {
      evaluations.push(updates);
    } else {
      evaluations[index] = { ...evaluations[index], ...updates };
    }
    onUpdate({ ...workflow, evaluations });
    setUnsavedChanges(true);
  }

  function duplicateEvaluationStep(evaluation: WorkflowEvaluationJson) {
    openNewEvaluationStepModal(evaluation);
  }

  function closeEvaluationStep() {
    setActiveEvaluation(null);
  }

  function openEvaluationStep(evaluation: WorkflowEvaluationJson) {
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

  usePreventReload(hasUnsavedChanges);

  let disabledTooltip: string | undefined;
  if (!workflow.title) {
    disabledTooltip = 'You must add a title';
  } else if (workflow.evaluations.length === 0) {
    disabledTooltip = 'You must add at least one step';
  }

  return (
    <Accordion
      key={workflow.id}
      expanded={isExpanded}
      onChange={(e, expand) => toggleRow(expand ? workflow.id : false)}
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box display='flex' alignItems='center' justifyContent='space-between' width='100%' gap={2}>
          {isExpanded && !isReadOnly ? (
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
            <Typography color={!workflow.title ? 'secondary' : 'inherit'}>
              {workflow.title || 'Untitled'}
              {workflow.archived && (
                <Typography component='span' color='textSecondary' sx={{ ml: 1 }}>
                  (Archived)
                </Typography>
              )}
            </Typography>
          )}

          <Box display='flex' justifyContent='flex-end' alignItems='center'>
            {!isExpanded && hasUnsavedChanges && (
              <Chip variant='outlined' size='small' color='warning' label='unsaved changes' sx={{ mr: 1 }} />
            )}
            {!readOnly && (
              <span onClick={(e) => e.stopPropagation()}>
                <Menu {...bindMenu(popupState)} onClick={popupState.close}>
                  <MenuItem onClick={duplicateWorkflow} disabled={!!workflow.archived}>
                    <ListItemIcon>
                      <ContentCopyOutlined fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Duplicate</ListItemText>
                  </MenuItem>
                  <Tooltip title={preventDelete ? 'There must be at least one workflow' : ''}>
                    <span>
                      <MenuItem onClick={deleteWorkflow} disabled={preventDelete}>
                        <ListItemIcon>
                          <DeleteOutlined fontSize='small' />
                        </ListItemIcon>
                        <ListItemText>Delete</ListItemText>
                      </MenuItem>
                    </span>
                  </Tooltip>
                  <MenuItem onClick={toggleArchiveWorkflow} disabled={workflow.archived ? !canCreateWorkflow : false}>
                    <ListItemIcon>
                      {workflow.archived ? <Unarchive fontSize='small' /> : <Archive fontSize='small' />}
                    </ListItemIcon>
                    <ListItemText>{workflow.archived ? 'Unarchive' : 'Archive'}</ListItemText>
                  </MenuItem>
                  <Tooltip
                    title={
                      workflow.privateEvaluations
                        ? 'Only reviewers can see all evaluation steps'
                        : 'All users can see all evaluation steps'
                    }
                  >
                    <span>
                      <MenuItem
                        onClick={() => {
                          updatePrivateEvaluations(!workflow.privateEvaluations);
                        }}
                        disabled={!!workflow.archived}
                      >
                        <ListItemIcon>
                          <VisibilityIcon visible={!workflow.privateEvaluations} size='small' />
                        </ListItemIcon>
                        <ListItemText>
                          {workflow.privateEvaluations ? 'Show evaluations' : 'Hide evaluations'}
                        </ListItemText>
                      </MenuItem>
                    </span>
                  </Tooltip>
                </Menu>
                <Box display='flex' gap={2} alignItems='center'>
                  <IconButton size='small' {...bindTrigger(popupState)}>
                    <MoreHoriz fontSize='small' />
                  </IconButton>
                </Box>
              </span>
            )}
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <MultiTabs tabs={['Steps', 'Permissions', 'Notifications']}>
          {({ value }) => (
            <Box pt={2}>
              {value === 'Steps' &&
                workflow.evaluations.map((evaluation, index) => (
                  <EvaluationRow
                    key={evaluation.id}
                    evaluation={evaluation}
                    onDelete={deleteEvaluationStep}
                    onDuplicate={duplicateEvaluationStep}
                    onEdit={openEvaluationStep}
                    onChangeOrder={changeEvaluationStepOrder}
                    readOnly={isReadOnly}
                    privateEvaluationsEnabled={!!workflow.privateEvaluations}
                  />
                ))}
              {value === 'Permissions' &&
                workflow.evaluations.map((evaluation, index) => (
                  <EvaluationPermissionsRow
                    key={evaluation.id}
                    isFirstEvaluation={index === 0}
                    evaluation={evaluation}
                    onDelete={deleteEvaluationStep}
                    onDuplicate={duplicateEvaluationStep}
                    onEdit={openEvaluationStep}
                    onChange={updateEvaluationStep}
                    readOnly={isReadOnly}
                  />
                ))}

              {value === 'Notifications' && (
                <>
                  <Card variant='outlined' sx={{ mb: 1 }}>
                    <Stack p={2}>
                      <Typography variant='h6' sx={{ flexGrow: 1 }}>
                        Draft
                      </Typography>
                      <Stack direction='row' justifyContent='space-between' alignItems='center'>
                        <Typography variant='body2' sx={{ flexGrow: 1 }}>
                          Remind authors to submit their draft after 24 hours
                        </Typography>
                        <Switch
                          checked={!!workflow.draftReminder}
                          onChange={(e) => updateDraftReminder(e.target.checked)}
                          disabled={isReadOnly}
                        />
                      </Stack>
                    </Stack>
                  </Card>
                  {workflow.evaluations.map((evaluation, index) => (
                    <EvaluationNotificationsRow
                      key={evaluation.id}
                      evaluation={evaluation}
                      readOnly={isReadOnly}
                      onChange={updateEvaluationStep}
                      nextEvaluationTitle={
                        workflow.evaluations.length > index + 1 ? workflow.evaluations[index + 1].title : undefined
                      }
                    />
                  ))}
                </>
              )}

              <Box display='flex' justifyContent='space-between' alignItems='center'>
                <Button disabled={isReadOnly} variant='text' onClick={() => openNewEvaluationStepModal()} height='1px'>
                  + Add step
                </Button>
                <Stack flexDirection='row' gap={1}>
                  {hasUnsavedChanges && (
                    <Button variant='outlined' color='secondary' onClick={cancelChanges}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    disabled={isReadOnly || !!disabledTooltip}
                    disabledTooltip={disabledTooltip}
                    onClick={saveWorkflow}
                    sx={{ opacity: hasUnsavedChanges ? 1 : 0 }}
                  >
                    Save
                  </Button>
                </Stack>
              </Box>
            </Box>
          )}
        </MultiTabs>

        <EvaluationDialog
          isFirstEvaluation={workflow.evaluations[0]?.id === activeEvaluation?.id}
          evaluation={activeEvaluation}
          onClose={closeEvaluationStep}
          onSave={updateEvaluationStep}
        />
      </AccordionDetails>
    </Accordion>
  );
}
