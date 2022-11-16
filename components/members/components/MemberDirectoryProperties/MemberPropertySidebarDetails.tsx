import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box, Collapse, IconButton, InputLabel, MenuItem, Stack, Tooltip, Typography } from '@mui/material';
import type { MemberPropertyPermission } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useMemo, useState } from 'react';

import Button from 'components/common/Button';
import { InputSearchRoleMultiple } from 'components/common/form/InputSearchRole';
import Modal from 'components/common/Modal';
import type { CreateMemberPropertyPermissionInput, MemberPropertyWithPermissions } from 'lib/members/interfaces';

import { MemberPropertyVisibility } from './MemberPropertyVisibility';

type Props = {
  property: MemberPropertyWithPermissions;
  isExpanded: boolean;
  readOnly: boolean;
  addPermissions: (propertyId: string, permissions: CreateMemberPropertyPermissionInput[]) => void;
  removePermission: (permission: MemberPropertyPermission) => void;
};

export function MemberPropertySidebarDetails ({ isExpanded, readOnly, addPermissions, removePermission, property }: Props) {
  const memberPropertySidebarItemPopupState = usePopupState({ variant: 'popover', popupId: 'member-property-sidebar-item' });
  const [selectedRoleIds, setSelectedRoleIds] = useState<string []>([]);

  const filterRoleIds = useMemo(() => {
    return [...new Set([...property.permissions.map(p => p.roleId), ...selectedRoleIds])].filter(Boolean) as string[];
  }, [property.permissions, selectedRoleIds]);

  function savePermissions () {
    addPermissions(property.id, selectedRoleIds.map(roleId => ({ roleId, memberPropertyId: property.id })));
    memberPropertySidebarItemPopupState.close();
    setSelectedRoleIds([]);
  }

  useEffect(() => {
    if (memberPropertySidebarItemPopupState.isOpen) {
      setSelectedRoleIds([]);
    }
  }, [memberPropertySidebarItemPopupState.isOpen]);

  return (
    <>
      <Collapse in={isExpanded}>
        <Stack mb={1}>
          <Stack>
            <Box pl={4}>
              <MemberPropertyVisibility
                property={property}
              />
            </Box>
            {property?.permissions.length ? (
              <Stack>
                <Tooltip title={`Only members with listed roles can see ${property.name} property.`}>
                  <Typography pl={4} variant='overline'>Restricted to roles:</Typography>
                </Tooltip>
                {property?.permissions.map(permission => (
                  <Stack key={permission.id} flexDirection='row' justifyContent='space-between' alignItems='center'>
                    <MenuItem
                      dense
                      sx={{
                        pl: 4,
                        alignItems: 'center',
                        display: 'flex',
                        justifyContent: 'space-between',
                        '&:hover .icons': {
                          opacity: 1
                        },
                        flex: 1,
                        '& .MuiListItemIcon-root': {
                          minWidth: 30
                        }
                      }}
                    >
                      <Typography variant='subtitle2'>{permission.role?.name || '-'}</Typography>
                      {!readOnly && (
                        <IconButton size='small' color='secondary' sx={{ opacity: 0 }} className='icons'>
                          <Tooltip title={`Delete ${permission.role?.name || ''} role from permissions`}>
                            <DeleteIcon fontSize='small' onClick={() => removePermission(permission)} />
                          </Tooltip>
                        </IconButton>
                      )}
                    </MenuItem>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Tooltip title={`Everyone in workspace can see ${property.name} property`}>
                <Typography pl={4} variant='overline' alignItems='center' display='flex'>
                  Everyone in workspace
                  <VisibilityOutlinedIcon fontSize='small' color='secondary' sx={{ ml: 1 }} />
                </Typography>
              </Tooltip>
            )}
          </Stack>

          {!readOnly && (
            <Button
              variant='text'
              size='small'
              color='secondary'
              startIcon={<AddOutlinedIcon />}
              onClick={memberPropertySidebarItemPopupState.open}
              sx={{
                flex: 1,
                justifyContent: 'flex-start',
                width: '100%',
                pl: 4
              }}
            >
              Add Role
            </Button>
          )}
        </Stack>
      </Collapse>

      <Modal size='large' open={memberPropertySidebarItemPopupState.isOpen} onClose={memberPropertySidebarItemPopupState.close} title='Add roles'>
        <Stack gap={0.5}>

          <InputLabel>Role</InputLabel>
          <InputSearchRoleMultiple
            onChange={setSelectedRoleIds}
            filter={{
              mode: 'exclude',
              userIds: filterRoleIds
            }}
          />
          <Button
            sx={{
              mt: 1,
              width: 'fit-content'
            }}
            onClick={savePermissions}
          >
            Add selected roles
          </Button>

        </Stack>
      </Modal>
    </>
  );
}
