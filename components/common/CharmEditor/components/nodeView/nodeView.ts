import type { NodeViewProps } from '@bangle.dev/core';
import type { EditorView } from '@bangle.dev/pm';

export type CharmNodeViewProps = {
  onResizeStop: (view: EditorView) => void;
  pageId: string;
  readOnly: boolean;
  deleteNode: () => void;
} & NodeViewProps;
