import { Box } from '@mui/material';
import Stack from '@mui/material/Stack';
import type {
  AssignablePagePermissionGroups,
  AssignedPagePermission,
  PagePermissionAssignmentByValues,
  TargetPermissionGroup
} from '@packages/core/permissions';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect } from 'react';

import { useGetPageMeta } from 'charmClient/hooks/pages';
import { useCreatePermissions, useDeletePermissions } from 'charmClient/hooks/permissions';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { canReceiveManualPermissionUpdates } from 'lib/pages';

import { AddPagePermissionsInput } from '../common/AddPagePermissionsInput';
import { CopyLinkFooter } from '../common/CopyLinkFooter';

import AddPagePermissionsForm from './AddPagePermissionsForm';
import { PagePermissionRow } from './PagePermissionRow';

const permissionDisplayOrder: AssignablePagePermissionGroups[] = ['role', 'user'];

/**
 * Orders permissions logically frole to user
 * @sideEffect Removes the permission from currrent space from the list so it can be handled in its own row
 * @param pagePermissions
 */
function sortAndFilterPagePermissions({
  pagePermissions
}: {
  pagePermissions: AssignedPagePermission[];
}): AssignedPagePermission<'user' | 'role'>[] {
  const sortedPermissions = pagePermissions
    .filter((permission) => {
      return permission.assignee.group === 'role' || permission.assignee.group === 'user';
    })

    .sort((a, b) => {
      const aPermission = permissionDisplayOrder.indexOf(a.assignee.group);
      const bPermission = permissionDisplayOrder.indexOf(b.assignee.group);

      if (aPermission < bPermission) {
        return -1;
      } else if (aPermission > bPermission) {
        return 1;
      } else {
        return 0;
      }
    });

  return sortedPermissions as AssignedPagePermission<'user' | 'role'>[];
}

interface Props {
  pageId: string;
  refreshPermissions: () => void;
  pagePermissions: AssignedPagePermission[];
  onCopyLink: VoidFunction;
}

export default function PaidPagePermissions({ pageId, pagePermissions, refreshPermissions, onCopyLink }: Props) {
  const { data: page } = useGetPageMeta(pageId);
  const { space } = useCurrentSpace();
  const { mutateMembers: refreshMembers } = useMembers();
  const { trigger: deletePermission } = useDeletePermissions();
  const { trigger: createPermission } = useCreatePermissions();
  const { open, isOpen, close } = usePopupState({ variant: 'popover', popupId: 'add-a-permission' });

  const spaceLevelPermission = pagePermissions.find(
    (permission) => space && permission.assignee.group === 'space' && permission.assignee.id === space?.id
  ) as AssignedPagePermission<'space'> | undefined;
  const { permissions: userPagePermissions } = usePagePermissions({
    pageIdOrPath: pageId
  });

  useEffect(() => {
    refreshPermissions();
  }, [pageId]);

  async function upsertPagePermission({
    assignee,
    permissionLevel
  }: PagePermissionAssignmentByValues<Exclude<AssignablePagePermissionGroups, 'public'>>) {
    const existingPermission = pagePermissions.find(
      (p) =>
        p.assignee.group === assignee.group &&
        (p.assignee as TargetPermissionGroup<Exclude<AssignablePagePermissionGroups, 'public'>>).id === assignee.id
    );

    if (!existingPermission || existingPermission.permissionLevel !== permissionLevel) {
      await createPermission({
        pageId,
        permission: {
          permissionLevel,
          assignee
        }
      });
      refreshPermissions();
    }
  }

  async function removePermission(permissionId: string) {
    if (permissionId) {
      await deletePermission({ permissionId });
      refreshPermissions();
    }
  }

  const userAndRolePermissions = sortAndFilterPagePermissions({ pagePermissions });
  const canEdit =
    userPagePermissions?.grant_permissions === true &&
    !!page &&
    canReceiveManualPermissionUpdates({ pageType: page.type });

  return (
    <Box>
      {canEdit && (
        <>
          <AddPagePermissionsInput onClick={open} />

          <Modal open={isOpen} onClose={close} title='Invite people to this page' size='420px'>
            <AddPagePermissionsForm
              existingPermissions={pagePermissions}
              pageId={pageId}
              permissionsAdded={() => {
                refreshMembers();
                refreshPermissions();
                close();
              }}
            />
          </Modal>
        </>
      )}

      <Stack gap={1} mt={1}>
        <PagePermissionRow
          editable={!!userPagePermissions?.grant_permissions}
          assignee={{
            group: 'space',
            id: space?.id as string
          }}
          existingPermission={spaceLevelPermission}
          onChange={upsertPagePermission}
          onDelete={removePermission}
        />
        {userAndRolePermissions.map((permission) => (
          <PagePermissionRow
            key={permission.id}
            editable={!!userPagePermissions?.grant_permissions}
            assignee={permission.assignee}
            existingPermission={permission}
            onChange={upsertPagePermission}
            onDelete={removePermission}
          />
        ))}
      </Stack>
      <CopyLinkFooter pagePath={page?.path} onCopyLink={onCopyLink} />
    </Box>
  );
}
