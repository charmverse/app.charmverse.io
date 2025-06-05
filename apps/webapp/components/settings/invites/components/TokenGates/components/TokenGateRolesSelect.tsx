import { styled } from '@mui/material';
import { InfoOutlined as InfoOutlinedIcon } from '@mui/icons-material';
import { Box, Chip, FormControl, MenuItem, Select, Typography } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import { isTruthy } from '@packages/utils/types';
import { useMemo } from 'react';

import { UpgradeChip } from 'components/settings/subscription/UpgradeWrapper';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useRoles } from 'hooks/useRoles';
import type { ListSpaceRolesResponse } from 'pages/api/roles';

/**
 * @renderSelected Show selected options in the options menu. Default is true.
 */
interface Props {
  onChange: (roleIds: string[]) => void;
  selectedRoleIds: string[];
  onDelete: (roleId: string) => void;
  isAdmin: boolean;
  disabled?: boolean;
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

export default function TokenGateRolesSelect({ disabled, onDelete, selectedRoleIds, onChange, isAdmin }: Props) {
  const { roles } = useRoles();

  const { isFreeSpace } = useIsFreeSpace();

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

  if (isFreeSpace) {
    return (
      <Box display='flex' justifyContent='center'>
        <UpgradeChip upgradeContext='custom_roles' />
      </Box>
    );
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

  const canEditRoles = isAdmin;

  return (
    <Tooltip title={!canEditRoles ? 'You do not have permission to edit roles' : ''}>
      <StyledFormControl size='small'>
        <Select<string[]>
          variant='standard'
          value={selectedRoleIds}
          fullWidth
          multiple
          onChange={selectOption}
          displayEmpty={true}
          disabled={!canEditRoles || roles?.length === 0 || disabled}
          sx={{ '& .MuiInputBase-input': { pb: 0 } }}
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
                      disabled={!canEditRoles || disabled}
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
    </Tooltip>
  );
}
