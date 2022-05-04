import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useEffect, useMemo, useState } from 'react';
import FormControl from '@mui/material/FormControl';
import { ListSpaceRolesResponse } from 'charmClient';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import useRoles from '../roles/hooks/useRoles';

/**
 * @renderSelected Show selected options in the options menu. Default is true.
 */
interface Props {
  defaultValues?: string[]
  onChange?: (roleIds: string[]) => void
}

export default function TokenGateRolesSelect ({ onChange, defaultValues = [] }: Props) {
  const [selectedRole, setSelectedRole] = useState<string[]>(defaultValues);
  const { roles } = useRoles();

  const rolesRecord: Record<string, ListSpaceRolesResponse> = useMemo(() => roles ? roles?.reduce((obj, role) => (
    { ...obj, [role.id]: role }
  ), {}) : {}, [roles]);

  function selectOption (ev: SelectChangeEvent<string[]>) {
    ev.preventDefault();
    const selected = ev?.target?.value as string[];
    setSelectedRole(selected);
    onChange?.(selected);
  }

  return (
    <FormControl sx={{ minWidth: 100, display: 'flex', gap: 1, flexDirection: 'row' }}>
      <Select<string[]>
        id='bounty-status'
        variant='outlined'
        value={selectedRole as any}
        multiple
        onChange={selectOption}
        displayEmpty={true}
        disabled={roles?.length === 0}
        renderValue={(roleIds) => (
          (roleIds.length === 0) ? (
            'Attach roles'
          ) : (
            <Stack direction='row' spacing={1}>
              {
                roleIds.map(roleId => {
                  return (
                    <Chip
                      label={rolesRecord[roleId].name}
                      variant='outlined'
                      onDelete={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    />
                  );
                })
              }
            </Stack>
          )
        )}
      >
        {roles?.map(role => <MenuItem value={role.id}>{role.name}</MenuItem>)}
      </Select>
    </FormControl>
  );
}

