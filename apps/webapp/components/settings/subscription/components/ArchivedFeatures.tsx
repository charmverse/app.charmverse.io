import { Box, Card, Stack, Typography } from '@mui/material';
import { humanizeConditions, humanizeConditionsData } from '@packages/lib/tokenGates/humanizeConditions';
import { useCallback } from 'react';

import charmClient from 'charmClient/charmClient';
import { useGetProposalWorkflows, useUnarchiveProposalWorkflow } from 'charmClient/hooks/spaces';
import { useGetTokenGates, useUnarchiveTokenGate } from 'charmClient/hooks/tokenGates';
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
  const { roles, refreshRoles } = useRoles({ includeArchived: true });
  const { data: tokenGates = [], mutate: refreshTokenGates } = useGetTokenGates(spaceId);
  const { data: workflows = [], mutate: refreshWorkflows } = useGetProposalWorkflows(spaceId);
  const { showMessage } = useSnackbar();

  // Get access hooks for limits
  const { currentCount: roleCount, maxCount: roleLimit } = useRoleAccess({ space });
  const { currentCount: tokenGateCount, maxCount: tokenGateLimit } = useTokenGateAccess({ space: space! });
  const { canCreateWorkflow, currentCount: workflowCount, maxCount: workflowLimit } = useWorkflowAccess();

  // Get unarchive hooks
  const { trigger: unarchiveTokenGate } = useUnarchiveTokenGate(spaceId);
  const { trigger: unarchiveWorkflow } = useUnarchiveProposalWorkflow(spaceId);

  const archivedRoles = roles?.filter((role) => role.archived) ?? [];
  const archivedTokenGates = tokenGates.filter((gate) => gate.archived);
  const archivedWorkflows = workflows.filter((workflow) => workflow.archived);

  const handleUnarchiveRole = useCallback(
    async (roleId: string) => {
      try {
        await charmClient.roles.unarchiveRole(roleId);
        await refreshRoles();
        showMessage('Role unarchived successfully');
      } catch (error) {
        showMessage('Failed to unarchive role', 'error');
      }
    },
    [showMessage, refreshRoles]
  );

  const handleUnarchiveTokenGate = useCallback(async () => {
    try {
      await unarchiveTokenGate();
      await refreshTokenGates();
      showMessage('Token gate unarchived successfully');
    } catch (error) {
      showMessage('Failed to unarchive token gate', 'error');
    }
  }, [unarchiveTokenGate, refreshTokenGates, showMessage]);

  const handleUnarchiveWorkflow = useCallback(
    async (workflowId: string) => {
      try {
        await unarchiveWorkflow({ workflowId });
        await refreshWorkflows();
        showMessage('Workflow unarchived successfully');
      } catch (error) {
        showMessage('Failed to unarchive workflow', 'error');
      }
    },
    [unarchiveWorkflow, refreshWorkflows, showMessage]
  );

  const hasArchivedFeatures = archivedRoles.length > 0 || archivedTokenGates.length > 0 || archivedWorkflows.length > 0;

  if (!hasArchivedFeatures) {
    return (
      <Stack alignItems='center' justifyContent='center' minHeight={200}>
        <Typography color='secondary'>No archived features</Typography>
      </Stack>
    );
  }

  return (
    <Stack gap={3}>
      {archivedRoles.length > 0 && (
        <Box>
          <Stack direction='row' alignItems='center' gap={1} mb={2}>
            <Typography variant='h6'>Roles</Typography>
            <Typography variant='body2' color='secondary'>
              ({roleCount}/{roleLimit} active, {archivedRoles.length} archived)
            </Typography>
          </Stack>
          <Stack gap={1}>
            {archivedRoles.map((role) => (
              <Card key={role.id} variant='outlined'>
                <Stack direction='row' justifyContent='space-between' alignItems='center' p={2}>
                  <Typography>{role.name}</Typography>
                  <Button
                    onClick={() => handleUnarchiveRole(role.id)}
                    variant='outlined'
                    size='small'
                    disabled={roleCount >= roleLimit}
                    disabledTooltip='You have reached the maximum number of active roles for your plan'
                  >
                    Unarchive
                  </Button>
                </Stack>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      {archivedTokenGates.length > 0 && (
        <Box>
          <Stack direction='row' alignItems='center' gap={1} mb={2}>
            <Typography variant='h6'>Token Gates</Typography>
            <Typography variant='body2' color='secondary'>
              ({tokenGateCount}/{tokenGateLimit} active, {archivedTokenGates.length} archived)
            </Typography>
          </Stack>
          <Stack gap={1}>
            {archivedTokenGates.map((gate) => (
              <Card key={gate.id} variant='outlined'>
                <Stack direction='row' justifyContent='space-between' alignItems='center' p={2}>
                  <Typography>
                    {humanizeConditions(humanizeConditionsData(gate.conditions), gate.conditions.operator)}
                  </Typography>
                  <Button
                    onClick={() => handleUnarchiveTokenGate()}
                    variant='outlined'
                    size='small'
                    disabled={tokenGateCount >= tokenGateLimit}
                    disabledTooltip='You have reached the maximum number of active token gates for your plan'
                  >
                    Unarchive
                  </Button>
                </Stack>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      {archivedWorkflows.length > 0 && (
        <Box>
          <Stack direction='row' alignItems='center' gap={1} mb={2}>
            <Typography variant='h6'>Proposal Workflows</Typography>
            <Typography variant='body2' color='secondary'>
              ({workflowCount}/{workflowLimit} active, {archivedWorkflows.length} archived)
            </Typography>
          </Stack>
          <Stack gap={1}>
            {archivedWorkflows.map((workflow) => (
              <Card key={workflow.id} variant='outlined'>
                <Stack direction='row' justifyContent='space-between' alignItems='center' p={2}>
                  <Typography>{workflow.title || 'Untitled Workflow'}</Typography>
                  <Button
                    onClick={() => handleUnarchiveWorkflow(workflow.id)}
                    variant='outlined'
                    size='small'
                    disabled={!canCreateWorkflow}
                    disabledTooltip='You have reached the maximum number of active workflows for your plan'
                  >
                    Unarchive
                  </Button>
                </Stack>
              </Card>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
