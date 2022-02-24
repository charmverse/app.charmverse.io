import { useMemo } from 'react';
import { alpha, Box, useTheme } from '@mui/material';
import { useEditorViewContext } from '@bangle.dev/react';

export default function PlaceHolder () {
  const view = useEditorViewContext();
  const theme = useTheme();
  const color = useMemo(() => alpha(theme.palette.text.secondary, 0.35), [theme]);
  // @ts-ignore missing types from the @bangle.dev/react package
  const docContent: { content: { size: number } }[] = view.state.doc.content.content;
  const isEmpty = docContent.length <= 1
    && (!docContent[0] || docContent[0].content.size === 0);
  // Only show placeholder if the editor content is empty
  return isEmpty ? (
    <Box sx={{
      top: '-2em',
      position: 'relative',
      color,
      // Place it beneath the actual editor
      zIndex: -20
    }}
    >
      Type '/' for commands
    </Box>
  ) : null;
}
