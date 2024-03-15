import { ProposalOperation, ProposalSystemRole } from '@charmverse/core/prisma';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import PersonIcon from '@mui/icons-material/Person';
import { Box, Card, Stack, Tooltip, Typography } from '@mui/material';
import { capitalize } from 'lodash';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import {
  UserAndRoleSelect,
  type SelectOption,
  type SystemRoleOptionPopulated
} from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { MembersIcon } from 'components/common/PageIcon';

import { evaluationIcons } from '../constants';

import type { ContextMenuProps } from './EvaluationContextMenu';
import { EvaluationContextMenu } from './EvaluationContextMenu';
import type { EvaluationTemplateFormItem } from './EvaluationDialog';

type SupportedOperation = Extract<ProposalOperation, 'view' | 'comment' | 'edit' | 'move'>;

export const proposalOperations: SupportedOperation[] = ['view', 'comment', 'edit', 'move'];

// const evaluateVerbs = {
//   [ProposalEvaluationType.feedback]: 'Move Forward',
//   [ProposalEvaluationType.vote]: 'Move Forward (Vote)',
//   [ProposalEvaluationType.rubric]: 'Move Forward (Evaluate)',
//   [ProposalEvaluationType.pass_fail]: 'Move Forward (Review)'
// };

export const allMembersSystemRole = {
  group: 'system_role',
  icon: (
    <Tooltip title='All members of this space'>
      <MembersIcon color='secondary' fontSize='small' />
    </Tooltip>
  ),
  id: ProposalSystemRole.space_member,
  label: 'All members'
} as const;

export const tokenHoldersSystemRole = {
  ...allMembersSystemRole,
  label: 'Token holders'
} as const;

export const authorSystemRole = {
  group: 'system_role',
  icon: (
    <Tooltip title='Author'>
      <PersonIcon color='secondary' fontSize='small' />
    </Tooltip>
  ),
  id: ProposalSystemRole.author,
  label: 'Author'
} as const;

export const currentReviewerSystemRole = {
  group: 'system_role',
  icon: (
    <Tooltip title='Reviewers selected for this evaluation'>
      <PersonIcon color='secondary' fontSize='small' />
    </Tooltip>
  ),
  id: ProposalSystemRole.current_reviewer,
  label: 'Reviewers (Current Step)'
} as const;

// a copy of current reviewer, with a different label for vote
const currentVoterSystemRole = {
  ...currentReviewerSystemRole,
  label: 'Voters (Current Step)'
};

export const allReviewersSystemRole = {
  group: 'system_role',
  icon: (
    <Tooltip title='Reviewers of any step in this workflow'>
      <PersonIcon color='secondary' fontSize='small' />
    </Tooltip>
  ),
  id: ProposalSystemRole.all_reviewers,
  label: 'All Reviewers'
} as SystemRoleOptionPopulated<ProposalSystemRole>;

export const extraEvaluationRoles: SystemRoleOptionPopulated<ProposalSystemRole>[] = [
  authorSystemRole,
  currentReviewerSystemRole,
  allReviewersSystemRole,
  allMembersSystemRole
];

const permissionOperationPlaceholders = {
  [ProposalOperation.view]: 'Only admins can view the proposal',
  [ProposalOperation.comment]: 'No one can comment',
  [ProposalOperation.edit]: 'Only admins can edit the proposal',
  [ProposalOperation.move]: 'Only admins can change the current step'
};

export function EvaluationPermissionsRow({
  evaluation,
  onDelete,
  onDuplicate,
  onRename,
  onChange,
  readOnly,
  isFirstEvaluation
}: {
  evaluation: WorkflowEvaluationJson;
  onChange: (evaluation: WorkflowEvaluationJson) => void;
  readOnly: boolean;
  isFirstEvaluation: boolean;
} & ContextMenuProps) {
  return (
    <Card variant='outlined' key={evaluation.id} sx={{ mb: 1 }}>
      <Box px={2} py={1}>
        <Box display='flex' alignItems='center' gap={1} mb={1} justifyContent='space-between'>
          {evaluationIcons[evaluation.type]()}
          <Typography variant='h6' sx={{ flexGrow: 1 }}>
            {evaluation.title}
          </Typography>
          <EvaluationContextMenu
            evaluation={evaluation}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onRename={onRename}
            readOnly={readOnly}
          />
        </Box>

        <Stack flex={1} className='CardDetail content'>
          <EvaluationPermissions
            isFirstEvaluation={isFirstEvaluation}
            evaluation={evaluation}
            onChange={onChange}
            readOnly={readOnly}
          />
        </Stack>
      </Box>
    </Card>
  );
}

export function EvaluationPermissions<T extends EvaluationTemplateFormItem | WorkflowEvaluationJson>({
  evaluation,
  isFirstEvaluation,
  onChange,
  readOnly
}: {
  evaluation: T;
  isFirstEvaluation: boolean; // use a default Move permission for the first evaluation in a workflow
  onChange: (evaluation: T) => void;
  readOnly?: boolean;
}) {
  function updatePermissionOperation(operation: ProposalOperation, resources: SelectOption[]) {
    const newPermissions = evaluation.permissions.filter((permission) => permission.operation !== operation);
    resources.forEach((resource) => {
      const permission: WorkflowEvaluationJson['permissions'][number] =
        resource.group === 'system_role'
          ? { operation, systemRole: resource.id as ProposalSystemRole }
          : resource.group === 'role'
          ? { operation, roleId: resource.id }
          : { operation, userId: resource.id };
      newPermissions.push(permission);
    });
    onChange({ ...evaluation, permissions: newPermissions });
  }
  const valuesByOperation = evaluation.permissions.reduce<Partial<Record<ProposalOperation, SelectOption[]>>>(
    (acc, permission) => {
      if (!acc[permission.operation]) {
        acc[permission.operation] = [];
      }
      acc[permission.operation]!.push({
        group: permission.systemRole ? 'system_role' : permission.roleId ? 'role' : 'user',
        id: permission.systemRole ?? permission.roleId ?? permission.userId!
      });
      return acc;
    },
    {}
  );

  return (
    <>
      <Typography variant='body2'>Who can:</Typography>

      {proposalOperations.map((operation) => (
        <Box key={operation} className='octo-propertyrow'>
          <PropertyLabel readOnly>{operation === 'move' ? 'Move Backward' : capitalize(operation)}</PropertyLabel>
          {isFirstEvaluation && operation === 'move' ? (
            <Tooltip title='Only authors can move back to Draft'>
              <span>
                <UserAndRoleSelect
                  readOnly
                  wrapColumn
                  value={[{ group: 'system_role', id: ProposalSystemRole.author }]}
                  systemRoles={[authorSystemRole]}
                  onChange={() => {}}
                />
              </span>
            </Tooltip>
          ) : (
            <UserAndRoleSelect
              readOnly={readOnly}
              variant='outlined'
              wrapColumn
              // required values cannot be removed
              isRequiredValue={(option) => {
                if (operation === 'view') {
                  return option.id === ProposalSystemRole.author || option.id === ProposalSystemRole.current_reviewer;
                }
                return false;
              }}
              value={valuesByOperation[operation] || []}
              systemRoles={extraEvaluationRoles}
              inputPlaceholder={permissionOperationPlaceholders[operation]}
              onChange={async (options) => updatePermissionOperation(operation, options)}
            />
          )}
        </Box>
      ))}

      {/* show evaluation action which is uneditable */}
      <Box className='octo-propertyrow' display='flex' alignItems='center !important'>
        <PropertyLabel readOnly>Move Forward</PropertyLabel>
        <UserAndRoleSelect
          readOnly
          wrapColumn
          value={[{ group: 'system_role', id: ProposalSystemRole.current_reviewer }]}
          systemRoles={evaluation.type === 'vote' ? [currentVoterSystemRole] : [currentReviewerSystemRole]}
          onChange={() => {}}
        />
      </Box>
    </>
  );
}
