import { Box, Chip, FormControl, MenuItem, Select } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useMemo } from 'react';
import styled from '@emotion/styled';
import Button from 'components/common/Button';
import useIsAdmin from 'hooks/useIsAdmin';
import { isTruthy } from 'lib/utilities/types';
import { ListSpaceRolesResponse } from 'pages/api/roles';
import useRoles from '../hooks/useRoles';

/**
 * @renderSelected Show selected options in the options menu. Default is true.
 */
interface Props {
  onChange: (roleIds: string[]) => void
  selectedRoleIds: string[]
  onDelete: (roleId: string) => void
}

const StyledFormControl = styled(FormControl)`
  min-width: 100px;
  display: flex;
  gap: 8px;
  flex-direction: row;

  .MuiInput-root {
    &::before, &::after {
    display: none;
  }

  .MuiSelect-select:focus {
    background: transparent;
  }
`;

export default function TokenGateRolesSelect ({ onDelete, selectedRoleIds, onChange }: Props) {
  const { roles } = useRoles();

  const rolesRecord: Record<string, ListSpaceRolesResponse> = useMemo(() => roles ? roles.reduce((obj, role) => (
    {
      ...obj,
      [role.id]: role
    }
  ), {}) : {}, [roles]);

  async function selectOption (ev: SelectChangeEvent<string[]>) {
    ev.preventDefault();
    onChange(ev.target.value as string[]);
  }

  const isAdmin = useIsAdmin();

  return (
    <StyledFormControl size='small'>
      <Select<string[]>
        variant='standard'
        value={selectedRoleIds}
        fullWidth
        multiple
        onChange={selectOption}
        displayEmpty={true}
        disabled={!isAdmin || roles?.length === 0}
        renderValue={(roleIds) => (
          (roleIds.length === 0) ? (
            <Button size='small' variant='text' color='secondary'>+ Add roles</Button>
          ) : (
            <Box display='flex' flexWrap='wrap' gap={0.5} maxWidth={400}>
              {
                roleIds.map(roleId => rolesRecord[roleId]).filter(isTruthy)
                  .map(role => (
                    <Chip
                      key={role.id}
                      label={role.name}
                      size='small'
                      onMouseDown={(event) => {
                        event.stopPropagation();
                      }}
                      disabled={!isAdmin}
                      onDelete={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(role.id);
                      }}
                    />
                  ))
              }
            </Box>
          )
        )}
      >
        {roles?.map(role => <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>)}
      </Select>
    </StyledFormControl>
  );
}

