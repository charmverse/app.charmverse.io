import styled from '@emotion/styled';
import { InfoOutlined as InfoOutlinedIcon } from '@mui/icons-material';
import { Box, Chip, FormControl, MenuItem, Select, Tooltip, Typography } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useMemo } from 'react';

import { useRoles } from 'hooks/useRoles';
import { isTruthy } from 'lib/utilities/types';
import type { ListSpaceRolesResponse } from 'pages/api/roles';

/**
 * @renderSelected Show selected options in the options menu. Default is true.
 */
interface Props {
  onChange: (roleIds: string[]) => void;
  selectedRoleIds: string[];
  onDelete: (roleId: string) => void;
  isAdmin: boolean;
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

export default function TokenGateRolesSelect({ onDelete, selectedRoleIds, onChange, isAdmin }: Props) {
  const { roles } = useRoles();

  const rolesRecord: Record<string, ListSpaceRolesResponse> = useMemo(
    () =>
      roles
        ? roles.reduce(
            (obj, role) => ({
              ...obj,
              [role.id]: role
            }),
            {}
          )
        : {},
    [roles]
  );

  async function selectOption(ev: SelectChangeEvent<string[]>) {
    ev.preventDefault();
    if (Array.isArray(ev.target.value)) {
      onChange(ev.target.value);
    }
  }

  if (roles?.length === 0) {
    return (
      <Box display='flex' justifyContent='center'>
        <Tooltip title='Add roles to enable this feature'>
          <InfoOutlinedIcon color='secondary' fontSize='small' />
        </Tooltip>
      </Box>
    );
  }

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
        renderValue={(roleIds) =>
          roleIds.length === 0 ? (
            <Typography color='secondary' fontSize='small'>
              + Assign role
            </Typography>
          ) : (
            <Box display='flex' flexWrap='wrap' gap={0.5} maxWidth={400}>
              {roleIds
                .map((roleId) => rolesRecord[roleId])
                .filter(isTruthy)
                .map((role) => (
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
                ))}
            </Box>
          )
        }
      >
        {roles?.map((role) => (
          <MenuItem key={role.id} value={role.id}>
            {role.name}
          </MenuItem>
        ))}
      </Select>
    </StyledFormControl>
  );
}
