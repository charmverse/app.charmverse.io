import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { Role } from '@prisma/client';
import useENSName from 'hooks/useENSName';
import { getDisplayName } from 'lib/users';
import Avatar from 'components/common/Avatar';
import { HTMLAttributes, ComponentProps, useEffect } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { useSWRConfig } from 'swr';
import useRoles from 'components/settings/roles/hooks/useRoles';
import { ListSpaceRolesResponse } from 'charmClient';

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
  defaultValue, disableCloseOnSelect = false, filter, ...props
}: Partial<ComponentProps<typeof Autocomplete>> & {filter?: IRolesFilter}) {
  const { roles } = useRoles();
  const { chainId } = useWeb3React<Web3Provider>();
  const defaultRole = typeof defaultValue === 'string' ? roles.find(role => {
    return role.id === defaultValue;
  }) : undefined;

  const { cache } = useSWRConfig();

  const filteredRoles = filter ? filterRoles(roles as any, filter) : roles;

  console.log('ROLES', filteredRoles, roles);

  return (
    <Autocomplete<ReducedRole>
      defaultValue={defaultRole}
      loading={roles.length === 0}
      sx={{ minWidth: 150 }}
      disableCloseOnSelect={disableCloseOnSelect}
      // @ts-ignore - not sure why this fails
      options={filteredRoles}
      autoHighlight
      getOptionLabel={(role) => role.name}
      renderOption={(_props, role) => role.name}
      renderInput={(params) => (
        <TextField
          {...params}
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
  function emitValue (users: ReducedRole[]) {
    console.log('change!', users);
    onChange(users.map(user => user.id));
  }

  console.log('Filter', filter);
  return (
    <InputSearchRoleBase
      {...props}
      onChange={(e, value) => emitValue(value as ReducedRole[])}
      multiple
      disableCloseOnSelect={true}
      filter={filter}
    />
  );
}

