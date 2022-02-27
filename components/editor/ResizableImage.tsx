import { NodeViewProps, Plugin, RawSpecs } from '@bangle.dev/core';
import { EditorState, EditorView, Node, Slice, Transaction } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import ImageIcon from '@mui/icons-material/Image';
import { Box, ListItem, Typography } from '@mui/material';
import { HTMLAttributes, useState } from 'react';
import BlockAligner from './BlockAligner';
import ImageSelector from './ImageSelector';
import Resizer from './Resizer';

const MAX_IMAGE_WIDTH = 750; const
  MIN_IMAGE_WIDTH = 100;

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
  const theme = useTheme();
  const [size, setSize] = useState(node.attrs.size);
  const view = useEditorViewContext();
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
  return (
    <Box style={{
      margin: theme.spacing(3, 0),
      display: 'flex',
      flexDirection: 'column'
    }}
    >
      <BlockAligner
        onDelete={() => {
          updateAttrs({
            src: null
          });
        }}
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
          maxConstraints={[MAX_IMAGE_WIDTH, MAX_IMAGE_WIDTH / aspectRatio]}
          minConstraints={[MIN_IMAGE_WIDTH, MIN_IMAGE_WIDTH / aspectRatio]}
        >
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
