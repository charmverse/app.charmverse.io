import type { PostCategoryPermissionAssignment } from '@charmverse/core/permissions';
import type { PostCategoryPermissionLevel } from '@charmverse/core/prisma-client';
import useSWR from 'swr';

import charmClient from 'charmClient';

export type BulkRolePostCategoryPermissionUpsert = { permissionLevel: PostCategoryPermissionLevel; roleIds: string[] };

type Props = {
  postCategoryId?: string | number;
};

export function usePostCategoryPermissionsList({ postCategoryId }: Props) {
  const { data: permissionsList, mutate: refreshPermissionsList } = useSWR(
    postCategoryId ? `/api/forum/post-categories/${postCategoryId}/permissions` : null,
    () => charmClient.permissions.forum.listPostCategoryPermissions(postCategoryId as string)
  );

  async function updatePermission(input: PostCategoryPermissionAssignment) {
    await charmClient.permissions.forum.upsertPostCategoryPermission(input);
    refreshPermissionsList();
  }

  async function deletePermission(permissionId: string) {
    await charmClient.permissions.forum.deletePostCategoryPermission(permissionId);
    refreshPermissionsList();
  }

  async function addRolePermissions({
    input,
    targetPostCategoryId
  }: {
    input: BulkRolePostCategoryPermissionUpsert;
    targetPostCategoryId: string;
  }) {
    await Promise.all(
      input.roleIds.map((id) =>
        charmClient.permissions.forum.upsertPostCategoryPermission({
          permissionLevel: input.permissionLevel,
          postCategoryId: targetPostCategoryId,
          assignee: { group: 'role', id }
        })
      )
    );
    refreshPermissionsList();
  }

  async function addPermission(input: PostCategoryPermissionAssignment) {
    await charmClient.permissions.forum.upsertPostCategoryPermission(input);
    refreshPermissionsList();
  }

  return {
    permissionsList,
    updatePermission,
    deletePermission,
    addRolePermissions,
    addPermission
  };
}
