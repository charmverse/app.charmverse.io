import type { Post } from '@charmverse/core/prisma-client';

import type { PermissionFilteringPolicyFnInput } from '../../core/policies';
import type { PostPermissionFlags } from '../interfaces';

export type PostResource = Pick<Post, 'id' | 'spaceId' | 'createdBy' | 'proposalId' | 'isDraft'>;
export type PostPolicyInput = PermissionFilteringPolicyFnInput<PostResource, PostPermissionFlags>;
