import { stringUtils } from '../../../utilities';
import type { CategoriesToFilter, PermissionCompute, PostCategoryPermissionAssignment } from '../../index';
import type { DefaultCategoryAssignment } from '../lib/forumPermissions/assignDefaultPostCategoryPermission';
import { ForumPermissionsClient } from '../lib/forumPermissions/client';
import type { PostCategorySearchToMutate } from '../lib/forumPermissions/mutatePostCategorySearch';

const client = new ForumPermissionsClient();

export async function computePostPermissions(input: PermissionCompute) {
  const result = await client.computePostPermissions({
    resourceId: input.resourceId,
    // Sanitise value from HTTP request since it is sometimes 'undefined'
    userId: !stringUtils.isUUID(input.userId as string) ? undefined : input.userId
  });
  return result;
}

export async function getPermissionedCategories(input: CategoriesToFilter) {
  const result = await client.getPermissionedCategories({ postCategories: input.postCategories, userId: input.userId });
  return result;
}

export async function computePostCategoryPermissions(input: PermissionCompute) {
  const result = await client.computePostCategoryPermissions({
    resourceId: input.resourceId,
    // Sanitise value from HTTP request since it is sometimes 'undefined'
    userId: !stringUtils.isUUID(input.userId as string) ? undefined : input.userId
  });
  return result;
}

export async function assignDefaultPostCategoryPermissions(input: DefaultCategoryAssignment) {
  const result = await client.assignDefaultPostCategoryPermissions(input);
  return result;
}

export async function upsertPostCategoryPermission(input: PostCategoryPermissionAssignment) {
  const result = await client.upsertPostCategoryPermission(input);
  return result;
}

export async function deletePostCategoryPermission(input: { permissionId: string }) {
  await client.deletePostCategoryPermission({
    permissionId: input.permissionId
  });
}

export async function mutatePostCategorySearch(input: PostCategorySearchToMutate) {
  const result = await client.mutatePostCategorySearch(input);
  return result;
}
