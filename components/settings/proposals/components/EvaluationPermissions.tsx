import { Box, Tooltip, Typography } from '@mui/material';
import { capitalize } from 'lodash';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import type {
  SystemRoleOptionPopulated,
  SelectOption
} from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { ProposalIcon, MembersIcon } from 'components/common/PageIcon';
import { permissionLevels, SystemRole } from 'lib/proposal/workflows/interfaces';
import type { EvaluationTemplate, PermissionLevel } from 'lib/proposal/workflows/interfaces';

import type { EvaluationTemplateFormItem } from './EvaluationDialog';

const extraEvaluationRoles: SystemRoleOptionPopulated<SystemRole>[] = [
  {
    group: 'system_role',
    icon: (
      <Tooltip title='Author'>
        <ProposalIcon color='secondary' fontSize='small' />
      </Tooltip>
    ),
    id: SystemRole.author,
    label: 'Author'
  },
  {
    group: 'system_role',
    icon: (
      <Tooltip title='Reviewers selected for this evaluation'>
        <ProposalIcon color='secondary' fontSize='small' />
      </Tooltip>
    ),
    id: SystemRole.current_reviewer,
    label: 'Current Reviewer'
  },
  {
    group: 'system_role',
    icon: (
      <Tooltip title='Reviewers of any step in this workflow'>
        <ProposalIcon color='secondary' fontSize='small' />
      </Tooltip>
    ),
    id: SystemRole.all_reviewers,
    label: 'All Reviewers'
  },
  {
    group: 'system_role',
    icon: (
      <Tooltip title='All members of this space'>
        <MembersIcon color='secondary' fontSize='small' />
      </Tooltip>
    ),
    id: SystemRole.space_member,
    label: 'Members'
  }
];

const evaluateVerbs = {
  rubric: 'Evaluate',
  vote: 'Vote',
  pass_fail: 'Review'
};

const permissionLevelPlaceholders = {
  view: 'Only admins can view the proposal',
  comment: 'No one can comment',
  edit: 'Only admins can edit the proposal',
  move: 'Only admins can change the current step'
};

export function EvaluationPermissions<T extends EvaluationTemplateFormItem | EvaluationTemplate>({
  evaluation,
  onChange,
  readOnly
}: {
  evaluation: T;
  onChange: (evaluation: T) => void;
  readOnly?: boolean;
}) {
  function updatePermissionLevel(level: PermissionLevel, resources: SelectOption[]) {
    const newPermissions = evaluation.permissions.filter((permission) => permission.level !== level);
    resources.forEach((resource) => {
      newPermissions.push({ group: resource.group, id: resource.id, level });
    });
    onChange({ ...evaluation, permissions: newPermissions });
  }
  const valuesByLevel = evaluation.permissions.reduce<Partial<Record<PermissionLevel, SelectOption[]>>>(
    (acc, permission) => {
      if (!acc[permission.level]) {
        acc[permission.level] = [];
      }
      acc[permission.level]!.push({
        group: permission.group,
        id: permission.id
      });
      return acc;
    },
    {}
  );
  return (
    <>
      <Typography variant='body2'>Who can:</Typography>

      {permissionLevels.map((level) => (
        <Box key={level} className='octo-propertyrow'>
          <PropertyLabel readOnly>{capitalize(level)}</PropertyLabel>
          <UserAndRoleSelect
            readOnly={readOnly}
            variant='outlined'
            wrapColumn
            value={valuesByLevel[level] || []}
            systemRoles={extraEvaluationRoles}
            inputPlaceholder={permissionLevelPlaceholders[level]}
            onChange={async (options) => updatePermissionLevel(level, options)}
          />
        </Box>
      ))}
      <Box className='octo-propertyrow'>
        <PropertyLabel readOnly>{evaluateVerbs[evaluation.type]}</PropertyLabel>
        <UserAndRoleSelect
          readOnly
          wrapColumn
          value={[{ group: 'system_role', id: SystemRole.current_reviewer }]}
          systemRoles={extraEvaluationRoles}
          onChange={() => {}}
        />
      </Box>
    </>
  );
}
