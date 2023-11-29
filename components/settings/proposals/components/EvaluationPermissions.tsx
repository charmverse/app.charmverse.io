import { ProposalEvaluationType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import { Box, Card, IconButton, Typography } from '@mui/material';
import { capitalize } from 'lodash';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import type {
  SystemRoleOptionPopulated,
  SelectOption
} from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { permissionLevels } from 'lib/proposal/evaluationWorkflows';
import type { EvaluationTemplate, PermissionLevel, SystemRole } from 'lib/proposal/evaluationWorkflows';

import type { EvaluationInput } from './EvaluationDialog';

const extraEvaluationRoles: SystemRoleOptionPopulated<SystemRole>[] = [
  { group: 'system_role', id: 'author', label: 'Author' },
  { group: 'system_role', id: 'reviewer', label: 'Reviewer' },
  { group: 'system_role', id: 'space_member', label: 'Member' }
];

export function EvaluationPermissions<T extends EvaluationInput | EvaluationTemplate>({
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
      newPermissions.push({ resourceType: resource.group, id: resource.id, level });
    });
    onChange({ ...evaluation, permissions: newPermissions });
  }
  const valuesByLevel = evaluation.permissions.reduce<Partial<Record<PermissionLevel, SelectOption[]>>>(
    (acc, permission) => {
      if (!acc[permission.level]) {
        acc[permission.level] = [];
      }
      acc[permission.level]!.push({
        group: permission.resourceType,
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
        <Box key={level} display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
          <PropertyLabel readOnly>{capitalize(level)}</PropertyLabel>
          <UserAndRoleSelect
            readOnly={readOnly}
            value={valuesByLevel[level] || []}
            systemRoles={extraEvaluationRoles}
            onChange={async (options) => updatePermissionLevel(level, options)}
          />
        </Box>
      ))}
    </>
  );
}
