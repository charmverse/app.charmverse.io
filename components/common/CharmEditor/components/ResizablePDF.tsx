import { BaseRawNodeSpec, NodeViewProps, Plugin } from '@bangle.dev/core';
import { DOMOutputSpec, EditorState, EditorView, Slice, Transaction } from '@bangle.dev/pm';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { Box, ListItem, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import charmClient from 'charmClient';
import { HTMLAttributes, memo, useMemo, useState } from 'react';
import PdfSelector from 'components/common/PdfSelector';
import { MIN_PDF_WIDTH, MAX_PDF_WIDTH } from 'lib/image/constants';
import { Document, Page, pdfjs } from 'react-pdf';
import Resizable from './Resizable/Resizable';

// https://github.com/wojtekmaj/react-pdf/issues/321#issuecomment-451291757
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

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
        src: {
          default: null
        },
        size: {
          default: MAX_PDF_WIDTH
        }
      },
      group: 'block',
      draggable: true,
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

type PDFViewerProps = {
  url: string,
  width: number
};

const PDF = memo((props: PDFViewerProps) => {
  const { url, width } = props;
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess ({ numPages }: { numPages : number }) {
    setPageCount(numPages);
    setPageNumber(pageNumber || 1);
  }

  function changePage (offset : number) {
    setPageNumber((prevPageNumber: number) => prevPageNumber + offset);
  }

  function previousPage () {
    changePage(-1);
  }

  function nextPage () {
    changePage(1);
  }

  return (
    <Box>
      <Document
        file={{ url }}
        onLoadSuccess={onDocumentLoadSuccess}
      >
        <Page pageNumber={pageNumber} width={width} />
      </Document>
      <div>
        <p>
          Page {pageNumber || (pageCount ? 1 : '--')} of {pageCount || '--'}
        </p>
        <IconButton onClick={previousPage} disabled={pageNumber <= 1}>
          <NavigateBeforeIcon fontSize='small' />
        </IconButton>
        <IconButton onClick={nextPage} disabled={!pageCount || pageNumber >= pageCount}>
          <NavigateNextIcon fontSize='small' />
        </IconButton>
      </div>
    </Box>
  );
});

function ResizablePDF ({ readOnly, onResizeStop, node, updateAttrs, selected }:
  NodeViewProps & {readOnly?: boolean, onResizeStop?: (view: EditorView) => void }) {
  readOnly = readOnly ?? false;

  const url: string = useMemo(() => node.attrs.src, [node.attrs.src]);
  const size: number = useMemo(() => node.attrs.size, [node.attrs.size]);

  // If there are no source for the node, return the pdf select component
  if (!url) {
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

  const handleDelete = () => {
    if (url?.includes('s3.amazonaws.com')) {
      charmClient.deleteFromS3(url);
    }
    updateAttrs({
      src: null,
      aspectRatio: 1
    });
  };

  if (readOnly) {
    return (
      <PDF url={url} width={size} />
    );
  }
  else {
    return (
      <Resizable
        initialSize={size}
        minWidth={MIN_PDF_WIDTH}
        updateAttrs={updateAttrs}
        onDelete={() => handleDelete()}
        onResizeStop={onResizeStop}
      >
        <PDF url={url} width={size} />
      </Resizable>
    );
  }
}

export default memo(ResizablePDF);
