import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Collapse, IconButton, InputLabel, Stack, Typography } from '@mui/material';
import type { MemberPropertyPermission } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useMemo, useState } from 'react';

import Button from 'components/common/Button';
import { InputSearchRoleMultiple } from 'components/common/form/InputSearchRole';
import Modal from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import type { CreateMemberPropertyPermissionInput, MemberPropertyWithPermissions } from 'lib/members/interfaces';

type Props = {
  property: MemberPropertyWithPermissions;
  isExpanded: boolean;
  readOnly: boolean;
  addPermissions: (propertyId: string, permissions: CreateMemberPropertyPermissionInput[]) => void;
  removePermission: (permission: MemberPropertyPermission) => void;
};

export function MemberPropertySidebarDetails ({ isExpanded, readOnly, addPermissions, removePermission, property }: Props) {
  const memberPropertySidebarItemPopupState = usePopupState({ variant: 'popover', popupId: 'member-property-sidebar-item' });
  const [deleteConfirmPermission, setDeleteConfirmPermission] = useState<null | MemberPropertyPermission>(null);
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
        <Stack pl={5} pr={2.5} mb={1}>
          {property?.permissions.length ? (
            <Stack>
              <Typography variant='overline'>Restricted to roles:</Typography>
              {property?.permissions.map(permission => (
                <Stack key={permission.id} flexDirection='row' justifyContent='space-between' alignItems='center'>
                  <Typography variant='subtitle2'>{permission.role?.name || '-'}</Typography>
                  {!readOnly && (
                    <IconButton size='small' color='secondary'>
                      <DeleteIcon fontSize='small' onClick={() => setDeleteConfirmPermission(permission)} />
                    </IconButton>
                  )}
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography variant='overline' alignItems='center' display='flex'>Everyone in workspace
              <VisibilityOutlinedIcon fontSize='small' color='secondary' sx={{ ml: 1 }} />
            </Typography>
          )}
          {!readOnly && (
            <Button
              variant='text'
              size='small'
              color='secondary'
              sx={{
                width: 'fit-content'
              }}
              startIcon={<AddOutlinedIcon />}
              onClick={memberPropertySidebarItemPopupState.open}
            >
              Add Role
            </Button>
          )}
        </Stack>
      </Collapse>

      <Modal size='large' open={memberPropertySidebarItemPopupState.isOpen} onClose={memberPropertySidebarItemPopupState.close} title='Add roles'>
        <Stack gap={0.5}>

          <InputLabel>Roles</InputLabel>
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
            Add
          </Button>

        </Stack>
      </Modal>

      <ConfirmDeleteModal
        title='Delete property role permission'
        question='Are you sure you delete this role permission?'
        onConfirm={() => {
          if (deleteConfirmPermission) {
            removePermission(deleteConfirmPermission);
          }
        }}
        onClose={() => setDeleteConfirmPermission(null)}
        open={!!deleteConfirmPermission}
      />
    </>
  );
}
