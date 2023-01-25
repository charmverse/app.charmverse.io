import type { NodeViewProps } from '@bangle.dev/core';
import type { EditorView } from '@bangle.dev/pm';

export type CharmNodeViewProps = {
  pageId?: string;
  readOnly: boolean;
  deleteNode: () => void;
} & NodeViewProps;
