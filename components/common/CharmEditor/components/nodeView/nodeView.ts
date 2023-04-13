import type { NodeViewProps } from '@bangle.dev/core';

export type CharmNodeViewProps = {
  pageId?: string;
  postId?: string;
  readOnly: boolean;
  deleteNode: () => void;
} & NodeViewProps;
