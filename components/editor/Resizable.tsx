import { NodeViewProps } from '@bangle.dev/core';
import { EditorView } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { useTheme } from '@emotion/react';
import { Box } from '@mui/system';
import { ReactNode, useState } from 'react';
import BlockAligner from './BlockAligner';
import Resizer from './Resizer';

interface ResizableProps {
  initialSize: number;
  children: ReactNode;
  minWidth: number;
  maxWidth: number;
  aspectRatio: number;
  updateAttrs: NodeViewProps['updateAttrs'];
  onDelete: () => void;
  onResizeStop?: (view: EditorView) => void;
}

export default function Resizable (props: ResizableProps) {
  const { onResizeStop, updateAttrs, onDelete, initialSize, children, maxWidth, minWidth, aspectRatio } = props;
  const theme = useTheme();
  const [size, setSize] = useState(initialSize);
  const view = useEditorViewContext();

  return (
    <Box display='flex' flexDirection='column'>
      <BlockAligner
        onDelete={onDelete}
        size={size}
      >
        <Resizer
          onResizeStop={(_, data) => {
            updateAttrs({
              size: data.size.width
            });
            if (onResizeStop) {
              onResizeStop(view);
            }
          }}
          width={size}
          height={size / aspectRatio}
          onResize={(_, data) => {
            setSize(data.size.width);
          }}
          maxConstraints={[maxWidth, maxWidth / aspectRatio]}
          minConstraints={[minWidth, minWidth / aspectRatio]}
        >
          {children}
        </Resizer>
      </BlockAligner>
    </Box>
  );
}
