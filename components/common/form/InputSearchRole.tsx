import { Autocomplete, TextField } from '@mui/material';
import Alert from '@mui/material/Alert';
import type { Role } from '@prisma/client';
import type { ComponentProps } from 'react';

import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useRoles } from 'hooks/useRoles';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import type { ListSpaceRolesResponse } from 'pages/api/roles';

interface IRolesFilter {
  mode: 'include' | 'exclude';
  userIds: string[];
}

type ReducedRole = Role | ListSpaceRolesResponse;

function filterRoles(roles: ReducedRole[], filter: IRolesFilter): ReducedRole[] {
  if (filter.mode === 'exclude') {
    return roles.filter((role) => {
      const shouldInclude = filter.userIds.indexOf(role.id) === -1;
      return shouldInclude;
    });
  } else {
    return roles.filter((role) => {
      const shouldInclude = filter.userIds.indexOf(role.id) > -1;
      return shouldInclude;
    });
  }
}

function InputSearchRoleBase({
  defaultValue,
  disableCloseOnSelect = false,
  filter,
  showWarningOnNoRoles = false,
  placeholder,
  readOnly,
  ...props
}: Partial<ComponentProps<typeof Autocomplete>> & { filter?: IRolesFilter } & { showWarningOnNoRoles?: boolean }) {
  const { roles } = useRoles();
  const space = useCurrentSpace();
  const { onClick } = useSettingsDialog();

  const defaultRole =
    typeof defaultValue === 'string'
      ? roles?.find((role) => {
          return role.id === defaultValue;
        })
      : defaultValue instanceof Array
      ? roles?.filter((r) => defaultValue.includes(r.id))
      : undefined;

  const filteredRoles = !!filter && !!roles ? filterRoles(roles as any, filter as IRolesFilter) : roles ?? [];

  if (roles?.length === 0 && showWarningOnNoRoles && !readOnly) {
    return (
      <Alert severity='warning'>
        There are no roles in this space. Space admins can create roles in the{' '}
        <Button variant='text' sx={{ fontWeight: 'bold' }} onClick={() => onClick(`${space?.name}-roles`)}>
          space settings page
        </Button>
        .
      </Alert>
    );
  }

  return (
    <Autocomplete<ReducedRole>
      defaultValue={defaultRole as any}
      loading={!roles}
      sx={{ minWidth: 150 }}
      disableCloseOnSelect={disableCloseOnSelect}
      placeholder={filteredRoles.length > 0 || roles?.length === 0 ? placeholder : ''}
      noOptionsText='No options available'
      // @ts-ignore - not sure why this fails
      options={filteredRoles}
      autoHighlight
      getOptionLabel={(role) => role.name}
      renderOption={(_props, role) => <li {..._props}>{role.name}</li>}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={filteredRoles.length > 0 || roles?.length === 0 ? placeholder : ''}
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
  onChange: (id: string) => void;
  defaultValue?: string;
  showWarningOnNoRoles?: boolean;
}

export function InputSearchRole(props: IInputSearchRoleProps) {
  function emitValue(selectedUser: Role) {
    if (selectedUser) {
      props.onChange(selectedUser.id);
    }
  }

  return <InputSearchRoleBase {...props} onChange={(e, value) => emitValue(value as Role)} multiple />;
}

interface IInputSearchRoleMultipleProps
  extends Partial<Omit<ComponentProps<typeof Autocomplete>, 'onChange' | 'defaultValue'>> {
  onChange: (id: string[]) => void;
  defaultValue?: string[];
  filter?: IRolesFilter;
  disableCloseOnSelect?: boolean;
  showWarningOnNoRoles?: boolean;
}

export function InputSearchRoleMultiple({
  onChange,
  filter,
  defaultValue,
  showWarningOnNoRoles,
  disableCloseOnSelect,
  ...props
}: IInputSearchRoleMultipleProps) {
  function emitValue(roles: ReducedRole[]) {
    onChange(roles.map((role) => role.id));
  }

  return (
    <InputSearchRoleBase
      showWarningOnNoRoles={showWarningOnNoRoles}
      disableCloseOnSelect={disableCloseOnSelect}
      onChange={(e, value) => emitValue(value as ReducedRole[])}
      multiple
      placeholder='Select roles'
      filter={filter}
      defaultValue={defaultValue}
      {...props}
    />
  );
}
