import { Alert, Box, Card, Stack, Typography } from '@mui/material';
import { humanizeConditions, humanizeConditionsData } from '@packages/lib/tokenGates/humanizeConditions';
import { useCallback, useMemo } from 'react';

import charmClient from 'charmClient/charmClient';
import {
  useArchiveProposalWorkflow,
  useGetProposalWorkflows,
  useUnarchiveProposalWorkflow
} from 'charmClient/hooks/spaces';
import { useGetTokenGates } from 'charmClient/hooks/tokenGates';
import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useRoleAccess } from 'hooks/useRoleAccess';
import { useRoles } from 'hooks/useRoles';
import { useSnackbar } from 'hooks/useSnackbar';
import { useTokenGateAccess } from 'hooks/useTokenGateAccess';
import { useWorkflowAccess } from 'hooks/useWorkflowAccess';

type Props = {
  spaceId: string;
};

export function ArchivedFeatures({ spaceId }: Props) {
  const { space } = useCurrentSpace();
  const { roles = [], refreshRoles } = useRoles({ includeArchived: true });
  const { data: tokenGates = [], mutate: refreshTokenGates } = useGetTokenGates(spaceId);
  const { data: workflows = [], mutate: refreshWorkflows } = useGetProposalWorkflows(spaceId);
  const { showMessage } = useSnackbar();

  const {
    roles: activeRoles,
    tokenGates: activeTokenGates,
    workflows: activeWorkflows
  } = useMemo(() => {
    // if archived is true move to the start of the array
    return {
      roles: roles?.sort((a, b) => (a.archived && !b.archived ? 1 : a.archived && b.archived ? -1 : 0)) || [],
      tokenGates: tokenGates.sort((a, b) => (a.archived && !b.archived ? 1 : a.archived && b.archived ? -1 : 0)) || [],
      workflows: workflows.sort((a, b) => (a.archived && !b.archived ? 1 : a.archived && b.archived ? -1 : 0)) || []
    };
  }, [roles, tokenGates, workflows]);

  // Get access hooks for limits
  const { canCreateRole, currentCount: roleCount, maxCount: roleLimit } = useRoleAccess({ space });
  const {
    currentCount: tokenGateCount,
    maxCount: tokenGateLimit,
    canCreateTokenGate
  } = useTokenGateAccess({ space: space! });
  const { canCreateWorkflow, currentCount: workflowCount, maxCount: workflowLimit } = useWorkflowAccess();

  // Get unarchive hooks
  const { trigger: unarchiveWorkflow } = useUnarchiveProposalWorkflow(spaceId);
  const { trigger: archiveWorkflow } = useArchiveProposalWorkflow(spaceId);

  const handleUnarchiveRole = useCallback(
    async (archive: boolean, roleId: string) => {
      try {
        if (archive) {
          await charmClient.roles.unarchiveRole(roleId);
        } else {
          await charmClient.roles.archiveRole(roleId);
        }
        await refreshRoles();
        showMessage(archive ? 'Role unarchived successfully' : 'Role archived successfully');
      } catch (error) {
        showMessage(archive ? 'Failed to unarchive role' : 'Failed to archive role', 'error');
      }
    },
    [showMessage, refreshRoles]
  );

  const handleTriggerTokenGateArchive = useCallback(
    async (archive: boolean, tokenGateId: string) => {
      try {
        if (archive) {
          await charmClient.tokenGates.unarchiveTokenGate(tokenGateId);
        } else {
          await charmClient.tokenGates.archiveTokenGate(tokenGateId);
        }
        await refreshTokenGates();
        showMessage(archive ? 'Token gate unarchived successfully' : 'Token gate archived successfully');
      } catch (error) {
        showMessage(archive ? 'Failed to archive token gate' : 'Failed to unarchive token gate', 'error');
      }
    },
    [refreshTokenGates, showMessage]
  );

  const handleTriggerWorkflowArchive = useCallback(
    async (archive: boolean, workflowId: string) => {
      try {
        if (archive) {
          await unarchiveWorkflow({ workflowId });
        } else {
          await archiveWorkflow({ workflowId });
        }
        await refreshWorkflows();
        showMessage(archive ? 'Workflow unarchived successfully' : 'Workflow archived successfully');
      } catch (error) {
        showMessage(archive ? 'Failed to unarchive workflow' : 'Failed to archive workflow', 'error');
      }
    },
    [unarchiveWorkflow, archiveWorkflow, refreshWorkflows, showMessage]
  );

  return (
    <Stack gap={3}>
      <Typography>Review the features activated with your plan.</Typography>
      <Box>
        <Stack direction='row' alignItems='center' gap={1} mb={2}>
          <Typography variant='h6'>Roles</Typography>
          <Typography variant='body2' color='secondary'>
            {roleLimit === Infinity ? 'Unlimited' : `${roleLimit - roleCount} remaining`}
          </Typography>
        </Stack>
        <Stack gap={1}>
          {activeRoles.length === 0 ? (
            <Typography>No roles added in space</Typography>
          ) : (
            activeRoles.map((role) => (
              <Card key={role.id} variant='outlined'>
                <Stack direction='row' justifyContent='space-between' alignItems='center' p={2}>
                  <Typography>{role.name}</Typography>
                  <Button
                    onClick={() => handleUnarchiveRole(role.archived, role.id)}
                    variant='outlined'
                    size='small'
                    disabled={!canCreateRole && role.archived}
                    disabledTooltip='You have reached the maximum number of active roles for your plan'
                  >
                    {role.archived ? 'Unarchive' : 'Archive'}
                  </Button>
                </Stack>
              </Card>
            ))
          )}
        </Stack>
      </Box>

      <Box>
        <Stack direction='row' alignItems='center' gap={1} mb={2}>
          <Typography variant='h6'>Token Gates</Typography>
          <Typography variant='body2' color='secondary'>
            {tokenGateLimit === Infinity ? 'Unlimited' : `${tokenGateLimit - tokenGateCount} remaining`}
          </Typography>
        </Stack>
        <Stack gap={1}>
          {activeTokenGates.length === 0 ? (
            <Typography>No token gates added in space</Typography>
          ) : (
            activeTokenGates.map((gate) => (
              <Card key={gate.id} variant='outlined'>
                <Stack direction='row' justifyContent='space-between' alignItems='center' p={2}>
                  <Typography>
                    {humanizeConditions(humanizeConditionsData(gate.conditions), gate.conditions.operator)}
                  </Typography>
                  <Button
                    onClick={() => handleTriggerTokenGateArchive(gate.archived, gate.id)}
                    variant='outlined'
                    size='small'
                    disabled={!canCreateTokenGate && gate.archived}
                    disabledTooltip='You have reached the maximum number of active token gates for your plan'
                  >
                    {gate.archived ? 'Unarchive' : 'Archive'}
                  </Button>
                </Stack>
              </Card>
            ))
          )}
        </Stack>
      </Box>

      <Box>
        <Stack direction='row' alignItems='center' gap={1} mb={2}>
          <Typography variant='h6'>Proposal Workflows</Typography>
          <Typography variant='body2' color='secondary'>
            {workflowLimit === Infinity ? 'Unlimited' : `${workflowLimit - workflowCount} remaining`}
          </Typography>
        </Stack>
        <Stack gap={1}>
          {activeWorkflows.length === 0 ? (
            <Typography>No workflows added in space</Typography>
          ) : (
            activeWorkflows.map((workflow) => (
              <Card key={workflow.id} variant='outlined'>
                <Stack direction='row' justifyContent='space-between' alignItems='center' p={2}>
                  <Typography>{workflow.title || 'Untitled Workflow'}</Typography>
                  <Button
                    onClick={() => handleTriggerWorkflowArchive(workflow.archived, workflow.id)}
                    variant='outlined'
                    size='small'
                    disabled={!canCreateWorkflow && workflow.archived}
                    disabledTooltip='You have reached the maximum number of active workflows for your plan'
                  >
                    {workflow.archived ? 'Unarchive' : 'Archive'}
                  </Button>
                </Stack>
              </Card>
            ))
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
