import { Autocomplete, TextField } from '@mui/material';
import { Role } from '@prisma/client';
import useRoles from 'hooks/useRoles';
import { ListSpaceRolesResponse } from 'pages/api/roles';
import { ComponentProps } from 'react';

type ReducedRole = Role | ListSpaceRolesResponse

export default function InputSearchContributorsRoles ({
  defaultValue, disableCloseOnSelect = false, excludedIds, placeholder, ...props
}: Partial<ComponentProps<typeof Autocomplete>> & { excludedIds?: string[] }) {
  const { roles } = useRoles();

  const defaultRole = typeof defaultValue === 'string' ? roles?.find(role => {
    return role.id === defaultValue;
  }) : (defaultValue instanceof Array ? (roles?.filter(r => defaultValue.includes(r.id))) : undefined);
  const excludedIdsSet = new Set(excludedIds);

  const includedRoles = roles?.filter(role => !excludedIdsSet.has(role.id)) ?? [];

  return (
    <Autocomplete<ReducedRole, true>
      defaultValue={defaultRole as any}
      loading={!roles}
      sx={{ minWidth: 150 }}
      disableCloseOnSelect={disableCloseOnSelect}
      placeholder={(includedRoles.length > 0 || roles?.length === 0) ? placeholder : ''}
      noOptionsText='No options available'
      // @ts-ignore - not sure why this fails
      options={
        includedRoles
      }
      autoHighlight
      getOptionLabel={(role) => role.name}
      renderOption={(_props, role) => (
        <li {..._props}>
          {role.name}
        </li>
      )}
      multiple
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={(includedRoles.length > 0 || roles?.length === 0) ? placeholder : ''}
          inputProps={{
            ...params.inputProps
          }}
        />
      )}
      {...props}
    />
  );
}
