import { NodeViewProps, Plugin } from '@bangle.dev/core';
import { EditorState, EditorView, Slice, Transaction } from '@bangle.dev/pm';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import ImageIcon from '@mui/icons-material/Image';
import { Box, ListItem, Typography } from '@mui/material';
import { HTMLAttributes } from 'react';
import BlockAligner from './BlockAligner';
import ImageSelector from './ImageSelector';
import Resizer from './Resizer';

const MAX_IMAGE_SIZE = 750; const
  MIN_IMAGE_SIZE = 250;

const StyledEmptyImageContainer = styled(Box)`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.5)};
  width: 100%;
  align-items: center;
  opacity: 0.5;
`;

export const pasteImagePlugin = new Plugin({
  props: {
    handlePaste: (view: EditorView, rawEvent: ClipboardEvent, slice: Slice) => {
      // @ts-ignore
      const contentRow = slice.content.content?.[0].content.content?.[0];

      if ((contentRow?.text as string)?.startsWith('http')) {
        const embedUrl = contentRow.text.split('.');
        if (embedUrl[embedUrl.length - 1].match(/(jpeg|jpg|png|webp|gif)/)) {
          insertImageNode(view.state, view.dispatch, view, { src: contentRow.text });
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

function insertImageNode (state: EditorState, dispatch: DispatchFn, view: EditorView, attrs?: { [key: string]: any }) {
  const type = state.schema.nodes.image;
  const newTr = type.create(attrs);
  const { tr } = view.state;
  const cursorPosition = state.selection.$head.pos;
  tr.insert(cursorPosition, newTr);
  if (dispatch) {
    dispatch(state.tr.replaceSelectionWith(newTr));
  }
}

function EmptyImageContainer (props: HTMLAttributes<HTMLDivElement>) {
  const theme = useTheme();

  return (
    <ListItem
      button
      disableRipple
      sx={{
        backgroundColor: theme.palette.background.light,
        p: 2,
        display: 'flex',
        borderRadius: theme.spacing(0.5)
      }}
      {...props}
    >
      <StyledEmptyImageContainer>
        <ImageIcon fontSize='small' />
        <Typography>
          Add an image
        </Typography>
      </StyledEmptyImageContainer>
    </ListItem>
  );
}

const StyledImage = styled.img`
  object-fit: cover;
  width: 100%;
  height: 100%;
  user-select: none;
  &:hover {
    cursor: initial;
  }
  border-radius: ${({ theme }) => theme.spacing(1)};
  box-shadow: ${({ theme }) => theme.shadows[3]}
`;

export function Image ({ node, updateAttrs }: NodeViewProps) {
  const theme = useTheme();

  // If there are no source for the node, return the image select component
  if (!node.attrs.src) {
    return (
      <ImageSelector onImageSelect={(imageSrc) => {
        updateAttrs({
          src: imageSrc
        });
      }}
      >
        <EmptyImageContainer />
      </ImageSelector>
    );
  }

  return (
    <Box style={{
      margin: theme.spacing(3, 0),
      display: 'flex',
      flexDirection: 'column'
    }}
    >
      <Box sx={{
        margin: theme.spacing(1, 0)
      }}
      >
        <a
          href={node.attrs.src}
          rel='noopener noreferrer nofollow'
          target='_blank'
        >
          {node.attrs.src}
        </a>
      </Box>
      <BlockAligner onDelete={() => {
        updateAttrs({
          src: null
        });
      }}
      >
        <Resizer initialSize={MIN_IMAGE_SIZE} maxSize={MAX_IMAGE_SIZE} minSize={MIN_IMAGE_SIZE}>
          <StyledImage
            draggable={false}
            src={node.attrs.src}
            alt={node.attrs.alt}
          />
        </Resizer>
      </BlockAligner>
    </Box>
  );
}
