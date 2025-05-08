import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import type { ListItemButtonProps } from '@mui/material';
import { Box, ListItemButton, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { MIN_PDF_WIDTH } from '@packages/bangleeditor/components/image/constants';
import dynamic from 'next/dynamic';
import type { Slice } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import type { EditorState, Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { memo, useMemo, useState } from 'react';

import BlockAligner from 'components/common/CharmEditor/components/BlockAligner';
import type { CharmNodeViewProps } from 'components/common/CharmEditor/components/nodeView/nodeView';
import PdfSelector from 'components/common/PdfSelector';

import Resizable from '../Resizable/Resizable';

const PDFViewer = dynamic(() => import('./PDFViewer'), {
  ssr: false
});

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

function insertPDFNode(state: EditorState, dispatch: DispatchFn, view: EditorView, attrs?: { [key: string]: any }) {
  const type = state.schema.nodes.pdf;
  const newTr = type.create(attrs);
  const { tr } = view.state;
  const cursorPosition = state.selection.$head.pos;
  tr.insert(cursorPosition, newTr);
  if (dispatch) {
    dispatch(state.tr.replaceSelectionWith(newTr));
  }
}

function EmptyPDFContainer({
  readOnly,
  isSelected,
  ...props
}: ListItemButtonProps & { readOnly: boolean; isSelected?: boolean }) {
  const theme = useTheme();

  return (
    <ListItemButton
      disableRipple
      disabled={readOnly}
      sx={{
        backgroundColor: isSelected && !readOnly ? 'var(--charmeditor-active)' : theme.palette.background.light,
        p: 2,
        display: 'flex'
      }}
      {...props}
    >
      <StyledEmptyPDFContainer>
        <PictureAsPdfIcon fontSize='small' />
        <Typography>Add a PDF</Typography>
      </StyledEmptyPDFContainer>
    </ListItemButton>
  );
}

type PDFViewerProps = {
  url: string;
  width: number;
};

const PDF = memo((props: PDFViewerProps) => {
  const { url, width } = props;
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setPageCount(numPages);
    setPageNumber(pageNumber || 1);
  }

  function changePage(offset: number) {
    setPageNumber((prevPageNumber: number) => prevPageNumber + offset);
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  return (
    <Box style={{ lineHeight: 'initial' /* override line-height 0 from BlockAligner */ }}>
      <PDFViewer onLoadSuccess={onDocumentLoadSuccess} pageNumber={pageNumber} url={url} width={width} />
      <div>
        <p>
          Page {pageNumber || (pageCount ? 1 : '--')} of {pageCount || '--'}
        </p>
        <IconButton onClick={previousPage} disabled={pageNumber <= 1} size='small'>
          <NavigateBeforeIcon fontSize='small' />
        </IconButton>
        <IconButton onClick={nextPage} disabled={!pageCount || pageNumber >= pageCount} size='small'>
          <NavigateNextIcon fontSize='small' />
        </IconButton>
      </div>
    </Box>
  );
});

function ResizablePDF({
  readOnly,
  onResizeStop,
  node,
  updateAttrs,
  selected,
  deleteNode
}: CharmNodeViewProps & { readOnly?: boolean; onResizeStop?: (view: EditorView) => void }) {
  readOnly = readOnly ?? false;

  const url: string = useMemo(() => node.attrs.src, [node.attrs.src]);
  const size: number = useMemo(() => node.attrs.size, [node.attrs.size]);
  const autoOpen = node.marks.some((mark) => mark.type.name === 'tooltip-marker');

  // If there are no source for the node, return the pdf select component
  if (!url) {
    if (readOnly) {
      return <EmptyPDFContainer readOnly={readOnly} isSelected={selected} />;
    } else {
      return (
        <BlockAligner onDelete={deleteNode}>
          <PdfSelector
            autoOpen={autoOpen}
            onPdfSelect={async (pdfSrc) => {
              updateAttrs({
                src: pdfSrc
              });
            }}
          >
            <EmptyPDFContainer readOnly={readOnly} isSelected={selected} />
          </PdfSelector>
        </BlockAligner>
      );
    }
  }

  const handleDelete = () => {
    updateAttrs({
      src: null,
      aspectRatio: 1
    });
  };

  if (readOnly) {
    return <PDF url={url} width={size} />;
  } else {
    return (
      <Resizable initialSize={size} minWidth={MIN_PDF_WIDTH} updateAttrs={updateAttrs} onDelete={() => handleDelete()}>
        <PDF url={url} width={size} />
      </Resizable>
    );
  }
}

export default memo(ResizablePDF);
