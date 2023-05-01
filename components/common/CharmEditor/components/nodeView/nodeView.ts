import type { NodeViewProps } from '@bangle.dev/core';

import type { IPagePermissionFlags } from 'lib/permissions/pages/page-permission-interfaces';

export type CharmNodeViewProps = {
  pageId?: string;
  postId?: string;
  readOnly: boolean;
  pagePermissions?: IPagePermissionFlags;
  deleteNode: () => void;
} & NodeViewProps;
