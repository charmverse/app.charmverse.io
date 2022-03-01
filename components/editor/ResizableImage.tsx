import { NodeViewProps, Plugin, RawSpecs } from '@bangle.dev/core';
import { EditorState, EditorView, Node, Slice, Transaction } from '@bangle.dev/pm';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import ImageIcon from '@mui/icons-material/Image';
import { Box, ListItem, Typography } from '@mui/material';
import { HTMLAttributes } from 'react';
import charmClient from 'charmClient';
import ImageSelector from './ImageSelector';
import Resizable from './Resizable';

const MAX_IMAGE_WIDTH = 750;
const MIN_IMAGE_WIDTH = 100;

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
  object-fit: contain;
  width: 100%;
  height: 100%;
  user-select: none;
  &:hover {
    cursor: initial;
  }
  border-radius: ${({ theme }) => theme.spacing(1)};
`;

export function imageSpec (): RawSpecs {
  return {
    type: 'node',
    name: 'image',
    schema: {
      inline: true,
      attrs: {
        caption: {
          default: null
        },
        src: {
          default: null
        },
        alt: {
          default: null
        },
        aspectRatio: {
          default: 1
        },
        size: {
          // Making sure default size is middle of max and min range
          default: (MIN_IMAGE_WIDTH + MAX_IMAGE_WIDTH) / 2
        }
      },
      group: 'inline',
      draggable: false,
      parseDOM: [
        {
          tag: 'img[src]',
          getAttrs: (dom: any) => ({
            src: dom.getAttribute('src'),
            alt: dom.getAttribute('alt')
          })
        }
      ] as any,
      toDOM: ((node: Node) => {
        return ['img', node.attrs];
      }) as any
    }
  };
}

// Create a new image element using a promise, this makes it possible to get the width and height of the image
function imagePromise (url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject();
    img.src = url;
  });
}

export function ResizableImage ({ onResizeStop, node, updateAttrs }:
  NodeViewProps & {onResizeStop?: (view: EditorView) => void }) {
  // If there are no source for the node, return the image select component
  if (!node.attrs.src) {
    return (
      <ImageSelector onImageSelect={async (imageSrc) => {
        const image = await imagePromise(imageSrc);
        updateAttrs({
          src: imageSrc,
          aspectRatio: image.width / image.height
        });
      }}
      >
        <EmptyImageContainer />
      </ImageSelector>
    );
  }

  const { aspectRatio } = node.attrs as {aspectRatio: number};

  function onDelete () {
    console.log('attrs', node.attrs);
    if (node.attrs.src) {
      charmClient.deleteFromS3(node.attrs.src);
    }
    updateAttrs({
      src: null,
      aspectRatio: 1
    });
  }

  return (
    <Resizable
      aspectRatio={aspectRatio}
      initialSize={node.attrs.size}
      maxWidth={MAX_IMAGE_WIDTH}
      minWidth={MIN_IMAGE_WIDTH}
      updateAttrs={updateAttrs}
      onDelete={onDelete}
      onResizeStop={onResizeStop}
    >
      <StyledImage
        draggable={false}
        src={node.attrs.src}
        alt={node.attrs.alt}
      />
    </Resizable>
  );
}
