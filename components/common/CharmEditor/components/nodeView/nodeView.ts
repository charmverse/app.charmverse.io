import type { PagePermissionFlags } from '@charmverse/core/permissions';

import type { NodeViewProps } from 'components/common/CharmEditor/components/@bangle.dev/core/node-view';

export type CharmNodeViewProps = {
  pageId?: string;
  postId?: string;
  readOnly: boolean;
  pagePermissions?: PagePermissionFlags;
  deleteNode: () => void;
} & NodeViewProps;
