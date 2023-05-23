import type { NodeViewProps } from '@bangle.dev/core';
import type { PagePermissionFlags } from '@charmverse/core';

export type CharmNodeViewProps = {
  pageId?: string;
  postId?: string;
  snapshotProposalId?: string | null;
  readOnly: boolean;
  pagePermissions?: PagePermissionFlags;
  deleteNode: () => void;
} & NodeViewProps;
