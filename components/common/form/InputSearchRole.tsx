import { Autocomplete, TextField } from '@mui/material';
import { Role } from '@prisma/client';
import { ComponentProps, useEffect, useState } from 'react';
import useRoles from 'components/settings/roles/hooks/useRoles';
import Alert from '@mui/material/Alert';
import { ListSpaceRolesResponse } from 'pages/api/roles';

interface IRolesFilter {
  mode: 'include' | 'exclude',
  userIds: string []
}

type ReducedRole = Role | ListSpaceRolesResponse

function filterRoles (roles: ReducedRole [], filter: IRolesFilter): ReducedRole [] {
  if (filter.mode === 'exclude') {
    return roles.filter(role => {
      const shouldInclude = filter.userIds.indexOf(role.id) === -1;
      return shouldInclude;
    });
  }
  else {
    return roles.filter(role => {
      const shouldInclude = filter.userIds.indexOf(role.id) > -1;
      return shouldInclude;
    });
  }
}

function InputSearchRoleBase ({
  defaultValue, disableCloseOnSelect = false, filter, placeholder, ...props
}: Partial<ComponentProps<typeof Autocomplete>> & {filter?: IRolesFilter}) {
  const { roles } = useRoles();

  const [availableRoles, setAvailableRoles] = useState<ListSpaceRolesResponse []>([]);

  useEffect(() => {
    if (roles) {
      setAvailableRoles(roles);
    }
  }, [roles]);

  const defaultRole = typeof defaultValue === 'string' ? availableRoles.find(role => {
    return role.id === defaultValue;
  }) : undefined;

  const filteredRoles = filter ? filterRoles(availableRoles, filter) : availableRoles;

  if (roles?.length === 0) {
    return (
      <Alert severity='warning'>
        There are no roles in this space. Workspace admins can create roles in the workspace settings page.
      </Alert>
    );
  }

  return (
    <Autocomplete<ReducedRole>
      defaultValue={defaultRole}
      loading={availableRoles.length === 0}
      sx={{ minWidth: 150 }}
      disableCloseOnSelect={disableCloseOnSelect}
      // @ts-ignore - not sure why this fails
      options={filteredRoles}
      autoHighlight
      getOptionLabel={(role) => role.name}
      renderOption={(_props, role) => (
        <li {..._props}>
          {role.name}
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          inputProps={{
            ...params.inputProps
          }}
        />
      )}
      {...props}
    />
  );
}

interface IInputSearchRoleProps {
  onChange: (id: string) => void
  defaultValue?: string
}

export function InputSearchRole (props: IInputSearchRoleProps) {
  function emitValue (selectedUser: Role) {
    if (selectedUser) {
      props.onChange(selectedUser.id);
    }
  }

  return <InputSearchRoleBase {...props} onChange={(e, value) => emitValue(value as Role)} multiple />;
}

interface IInputSearchRoleMultipleProps {
  onChange: (id: string[]) => void
  defaultValue?: string[]
  filter?: IRolesFilter
}

export function InputSearchRoleMultiple ({ onChange, filter, ...props }: IInputSearchRoleMultipleProps) {

  function emitValue (roles: ReducedRole[]) {
    onChange(roles.map(role => role.id));
  }

  return (
    <InputSearchRoleBase
      {...props}
      onChange={(e, value) => emitValue(value as ReducedRole[])}
      multiple
      placeholder='Select roles'
      filter={filter}
    />
  );
}

