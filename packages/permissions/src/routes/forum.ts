import type {
  CategoriesToFilter,
  PermissionCompute,
  PermissionResource,
  PostCategoryPermissionAssignment
} from '@packages/core/permissions';
import { stringUtils } from '@packages/core/utilities';
import Router from 'koa-router';

import type { DefaultCategoryAssignment } from 'lib/forumPermissions/assignDefaultPostCategoryPermission';
import { ForumPermissionsClient } from 'lib/forumPermissions/client';
import type { PostCategorySearchToMutate } from 'lib/forumPermissions/mutatePostCategorySearch';

const client = new ForumPermissionsClient();

const router = new Router({
  prefix: '/api/forum'
});

router.get('/compute-post-permissions', async (ctx) => {
  const input = ctx.request.query as PermissionCompute;

  const result = await client.computePostPermissions({
    resourceId: input.resourceId,
    // Sanitise value from HTTP request since it is sometimes 'undefined'
    userId: !stringUtils.isUUID(input.userId as string) ? undefined : input.userId
  });
  ctx.body = result;
});

router.post('/get-permissioned-categories', async (ctx) => {
  const input = (
    typeof ctx.request.body === 'string' ? JSON.parse(ctx.request.body) : ctx.request.body
  ) as CategoriesToFilter;
  const result = await client.getPermissionedCategories({ postCategories: input.postCategories, userId: input.userId });
  ctx.body = result;
});

router.get('/compute-post-category-permissions', async (ctx) => {
  const input = ctx.request.query as PermissionCompute;

  const result = await client.computePostCategoryPermissions({
    resourceId: input.resourceId,
    // Sanitise value from HTTP request since it is sometimes 'undefined'
    userId: !stringUtils.isUUID(input.userId as string) ? undefined : input.userId
  });
  ctx.body = result;
});

router.post('/assign-default-post-category-permissions', async (ctx) => {
  const input = (
    typeof ctx.request.body === 'string' ? JSON.parse(ctx.request.body) : ctx.request.body
  ) as DefaultCategoryAssignment;

  const result = await client.assignDefaultPostCategoryPermissions(input);
  ctx.body = result;
  ctx.response.status = 201;
});

router.post('/upsert-post-category-permission', async (ctx) => {
  const input = (
    typeof ctx.request.body === 'string' ? JSON.parse(ctx.request.body) : ctx.request.body
  ) as PostCategoryPermissionAssignment;

  const result = await client.upsertPostCategoryPermission(input);
  ctx.body = result;
  ctx.response.status = 201;
});

router.delete('/delete-post-category-permission', async (ctx) => {
  let permissionId = ctx.request.query.permissionId as string;

  if (!permissionId) {
    permissionId = (typeof ctx.request.body === 'string' ? JSON.parse(ctx.request.body) : ctx.request.body)
      ?.permissionId;
  }
  await client.deletePostCategoryPermission({
    permissionId
  });
  ctx.response.status = 204;
});

router.post('/mutate-post-category-search', async (ctx) => {
  const input = (
    typeof ctx.request.body === 'string' ? JSON.parse(ctx.request.body) : ctx.request.body
  ) as PostCategorySearchToMutate;

  const result = await client.mutatePostCategorySearch(input);
  ctx.body = result;
});

export const forumPermissionsRouter = router;
