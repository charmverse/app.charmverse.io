import type { MemberProperty, MemberPropertyPermission } from '@charmverse/core/prisma';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box, Checkbox, Collapse, IconButton, InputLabel, MenuItem, Stack, Tooltip, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useMemo, useState } from 'react';

import { Button } from 'components/common/Button';
import { InputSearchRoleMultiple } from 'components/common/form/InputSearchRole';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import type {
  CreateMemberPropertyPermissionInput,
  MemberPropertyWithPermissions
} from '@packages/lib/members/interfaces';

import { MemberPropertyVisibility } from './MemberPropertyVisibility';

type Props = {
  property: MemberPropertyWithPermissions;
  isExpanded: boolean;
  addPermissions: (propertyId: string, permissions: CreateMemberPropertyPermissionInput[]) => void;
  removePermission: (permission: MemberPropertyPermission) => void;
  updateProperty: (
    propertyData: Partial<MemberProperty> & {
      id: string;
    }
  ) => Promise<void>;
};

export function MemberPropertySidebarDetails({
  isExpanded,
  addPermissions,
  removePermission,
  property,
  updateProperty
}: Props) {
  const isAdmin = useIsAdmin();
  const { isFreeSpace } = useIsFreeSpace();
  const { space } = useCurrentSpace();
  const canEditPropertyPermissions = isAdmin && !isFreeSpace;

  const memberPropertySidebarItemPopupState = usePopupState({
    variant: 'popover',
    popupId: 'member-property-sidebar-item'
  });
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const filterRoleIds = useMemo(() => {
    return [...new Set([...property.permissions.map((p) => p.roleId), ...selectedRoleIds])].filter(Boolean) as string[];
  }, [property.permissions, selectedRoleIds]);

  function savePermissions() {
    addPermissions(
      property.id,
      selectedRoleIds.map((roleId) => ({ roleId, memberPropertyId: property.id }))
    );
    memberPropertySidebarItemPopupState.close();
    setSelectedRoleIds([]);
  }

  useEffect(() => {
    if (memberPropertySidebarItemPopupState.isOpen) {
      setSelectedRoleIds([]);
    }
  }, [memberPropertySidebarItemPopupState.isOpen]);

  const disabled = !isAdmin || space?.primaryMemberIdentity?.toLowerCase() === property.type;

  return (
    <>
      <Collapse in={isExpanded} mountOnEnter={true} unmountOnExit={true}>
        <Stack mb={1}>
          {!['role', 'join_date', 'profile_pic'].includes(property.type) ? (
            <Stack flexDirection='row' justifyContent='space-between' mr={2}>
              <Tooltip title={isAdmin ? 'Require members to fill this property during onboarding' : ''}>
                <Typography pl={4} variant='overline' alignItems='center' display='flex'>
                  Required
                </Typography>
              </Tooltip>
              <Tooltip
                title={
                  space?.primaryMemberIdentity?.toLocaleLowerCase() === property.type
                    ? 'Primary identity must always be required'
                    : ''
                }
              >
                <div>
                  <Checkbox
                    size='small'
                    sx={{
                      p: 0
                    }}
                    checked={property.required}
                    disabled={disabled}
                    onChange={(e) => {
                      updateProperty({
                        id: property.id,
                        required: e.target.checked
                      });
                    }}
                  />
                </div>
              </Tooltip>
            </Stack>
          ) : null}
          {property.type !== 'wallet' && (
            <Stack>
              <Box pl={4} mr={2}>
                <MemberPropertyVisibility property={property} />
              </Box>
              {property?.permissions.length ? (
                <Stack>
                  <Tooltip title={`Only members with listed roles can see ${property.name} property.`}>
                    <Typography pl={4} variant='overline'>
                      Restricted to roles:
                    </Typography>
                  </Tooltip>
                  {property?.permissions.map((permission) => (
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
                        {canEditPropertyPermissions && (
                          <IconButton size='small' color='secondary' sx={{ opacity: 0 }} className='icons'>
                            <Tooltip title={`Delete ${permission.role?.name || ''} role from permissions`}>
                              <DeleteOutlinedIcon fontSize='small' onClick={() => removePermission(permission)} />
                            </Tooltip>
                          </IconButton>
                        )}
                      </MenuItem>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Tooltip title={`Everyone in space can see ${property.name} property`} disableInteractive>
                  <Typography pl={4} variant='overline' alignItems='center' display='flex'>
                    Everyone in space
                    <VisibilityOutlinedIcon fontSize='small' color='secondary' sx={{ ml: 1 }} />
                  </Typography>
                </Tooltip>
              )}
            </Stack>
          )}

          {canEditPropertyPermissions && property.type !== 'wallet' && (
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

      <Modal
        size='large'
        open={memberPropertySidebarItemPopupState.isOpen}
        onClose={memberPropertySidebarItemPopupState.close}
        title='Add roles'
      >
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
            disabled={!selectedRoleIds.length}
          >
            Add selected roles
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
