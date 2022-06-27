import { BaseRawNodeSpec, NodeViewProps, Plugin, RawSpecs } from '@bangle.dev/core';
import { DOMOutputSpec, EditorState, EditorView, Node, Slice, Transaction } from '@bangle.dev/pm';

import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { Box, ListItem, Typography } from '@mui/material';
import charmClient from 'charmClient';
import { HTMLAttributes, memo, useCallback } from 'react';
import PdfSelector from 'components/common/PdfSelector';
import { MAX_IMAGE_WIDTH, MIN_IMAGE_WIDTH } from 'lib/image/constants';
import Resizable from './Resizable/Resizable';

const StyledEmptyPDFContainer = styled(Box)`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.5)};
  width: 100%;
  align-items: center;
  opacity: 0.5;
`;

export const pastePdfPlugin = new Plugin({
  props: {
    handlePaste: (view: EditorView, rawEvent: ClipboardEvent, slice: Slice) => {
      // @ts-ignore
      const contentRow = slice.content.content?.[0].content.content?.[0];
      if ((contentRow?.text as string)?.startsWith('http')) {
        const embedUrl = contentRow.text.split('.');
        if (embedUrl[embedUrl.length - 1].match(/(pdf)/)) {
          insertPDFNode(view.state, view.dispatch, view, { src: contentRow.text });
          return true;
        }
        return false;
      }
      return false;
    }
  }
});

interface DispatchFn {
  (tr: Transaction): void;
}

function insertPDFNode (state: EditorState, dispatch: DispatchFn, view: EditorView, attrs?: { [key: string]: any }) {
  const type = state.schema.nodes.pdf;
  const newTr = type.create(attrs);
  const { tr } = view.state;
  const cursorPosition = state.selection.$head.pos;
  tr.insert(cursorPosition, newTr);
  if (dispatch) {
    dispatch(state.tr.replaceSelectionWith(newTr));
  }
}

function EmptyPDFContainer ({ readOnly, isSelected, ...props }: HTMLAttributes<HTMLDivElement> & {readOnly: boolean, isSelected?: boolean}) {
  const theme = useTheme();

  return (
    <ListItem
      button
      disableRipple
      disabled={readOnly}
      sx={{
        backgroundColor: (isSelected && !readOnly) ? 'rgba(46, 170, 220, 0.2)' : theme.palette.background.light,
        p: 2,
        display: 'flex'
      }}
      {...props}
    >
      <StyledEmptyPDFContainer>
        <PictureAsPdfIcon fontSize='small' />
        <Typography>
          Add a PDF
        </Typography>
      </StyledEmptyPDFContainer>
    </ListItem>
  );
}

export function pdfSpec () {
  const spec: BaseRawNodeSpec = {
    name: 'pdf',
    type: 'node',
    schema: {
      attrs: {
        base: {
          default: null
        },
        quote: {
          default: null
        }
      },
      group: 'block',
      parseDOM: [{ tag: 'div.charm-pdf' }],
      toDOM: (): DOMOutputSpec => {
        return ['div.charm-pdf'];
      }
    },
    markdown: {
      toMarkdown: () => null
    }
  };
  return spec;
}

function ResizablePDF ({ readOnly, onResizeStop, node, updateAttrs, selected }:
  NodeViewProps & {readOnly?: boolean, onResizeStop?: (view: EditorView) => void }) {
  readOnly = readOnly ?? false;

  // If there are no source for the node, return the pdf select component
  if (!node.attrs.src) {
    if (readOnly) {
      return <EmptyPDFContainer readOnly={readOnly} isSelected={selected} />;
    }
    else {
      return (
        <PdfSelector
          autoOpen={true}
          onPdfSelect={async (pdfSrc) => {
            updateAttrs({
              src: pdfSrc
            });
          }}
        >
          <EmptyPDFContainer readOnly={readOnly} isSelected={selected} />
        </PdfSelector>
      );
    }
  }

  const onDelete = useCallback(() => {
    if (node.attrs.src?.includes('s3.amazonaws.com')) {
      charmClient.deleteFromS3(node.attrs.src);
    }
    updateAttrs({
      src: null,
      aspectRatio: 1
    });
  }, []);

  if (readOnly) {
    return (
      <Box></Box>
    );
  }
  else {
    return (
      <Resizable
        initialSize={node.attrs.size}
        minWidth={MIN_IMAGE_WIDTH}
        updateAttrs={updateAttrs}
        onDelete={onDelete}
        onResizeStop={onResizeStop}
      >
        <Box></Box>
      </Resizable>
    );
  }
}

export default memo(ResizablePDF);
