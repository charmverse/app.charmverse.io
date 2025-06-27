import type { PagePermissionFlags } from '@packages/core/permissions';

import type { NodeViewProps } from '../@bangle.dev/core/node-view';

export type CharmNodeViewProps = {
  pageId?: string;
  postId?: string;
  readOnly: boolean;
  pagePermissions?: PagePermissionFlags;
  deleteNode: () => void;
} & NodeViewProps;
