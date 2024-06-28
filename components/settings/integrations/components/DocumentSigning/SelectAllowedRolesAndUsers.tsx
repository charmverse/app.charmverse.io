import { Alert, FormLabel, Stack, Typography } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';

import { useGetAllowedDocusignUsersAndRoles, usePutAllowedDocusignUsersAndRoles } from 'charmClient/hooks/docusign';
import type { SelectOptionPopulated } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

export function SelectAllowedRolesAndUsers() {
  const { space } = useCurrentSpace();

  const { data: allowedUsersAndRoles, mutate: refreshAllowedDocusignUsersAndRoles } =
    useGetAllowedDocusignUsersAndRoles({ spaceId: space?.id });

  const { trigger: updatedAllowedUsersAndRoles } = usePutAllowedDocusignUsersAndRoles();

  async function onChange(values: SelectOptionPopulated[]) {
    const payload = values.map((value) => {
      if (value.group === 'user') {
        return {
          userId: value.id
        };
      }
      return {
        roleId: value.id
      };
    });

    await updatedAllowedUsersAndRoles({ spaceId: space?.id as string, allowedRolesAndUsers: payload });

    refreshAllowedDocusignUsersAndRoles();
  }

  const mappedValue = allowedUsersAndRoles?.map((allowedUserOrRole) => {
    if (allowedUserOrRole.userId) {
      return {
        group: 'user',
        id: allowedUserOrRole.userId as string
      };
    }
    return {
      group: 'role',
      id: allowedUserOrRole.roleId as string
    };
  });

  return (
    <Stack gap={1}>
      {allowedUsersAndRoles?.length === 0 && (
        <Alert severity='warning'>Restrict access to your Docusign account to specific users or roles.</Alert>
      )}
      <Typography variant='body2' fontWeight='bold'>
        Users and roles with Docusign access
      </Typography>
      <UserAndRoleSelect
        onChange={onChange}
        value={mappedValue ?? []}
        emptyPlaceholderContent='Select users or roles'
      />
    </Stack>
  );
}
