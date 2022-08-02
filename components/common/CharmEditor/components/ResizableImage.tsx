import { NodeViewProps, Plugin, RawSpecs } from '@bangle.dev/core';
import { EditorState, EditorView, Node, Slice, Transaction } from '@bangle.dev/pm';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import ImageIcon from '@mui/icons-material/Image';
import { Box, ListItem, Typography } from '@mui/material';
import charmClient from 'charmClient';
import { HTMLAttributes, memo, useCallback } from 'react';
import ImageSelector from 'components/common/ImageSelector/ImageSelector';
import { MAX_IMAGE_WIDTH, MIN_IMAGE_WIDTH } from 'lib/image/constants';
import Resizable from './Resizable/Resizable';

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

function EmptyImageContainer ({ readOnly, isSelected, ...props }: HTMLAttributes<HTMLDivElement> & {readOnly: boolean, isSelected?: boolean}) {
  const theme = useTheme();

  return (
    <ListItem
      button
      disableRipple
      disabled={readOnly}
      sx={{
        backgroundColor: (isSelected && !readOnly) ? 'var(--charmeditor-active)' : theme.palette.background.light,
        p: 2,
        display: 'flex'
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
  max-width: 100%;
  width: 100%;
  height: auto;
  user-select: none;
  &:hover {
    cursor: initial;
  }
`;

export function imageSpec (): RawSpecs {
  return {
    type: 'node',
    name: 'image',
    schema: {
      inline: false,
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
        size: {
          // Making sure default size is middle of max and min range
          default: (MIN_IMAGE_WIDTH + MAX_IMAGE_WIDTH) / 2
        }
      },
      group: 'block',
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
    },
    markdown: {
      toMarkdown: (state, node) => {

        const { src } = node.attrs;

        if (src) {
          const toWrite = `![](${src})`;
          state.text(toWrite, false);
          state.ensureNewLine();
        }
      }
    }
  };
}

function ResizableImage ({ readOnly, onResizeStop, node, updateAttrs, selected }:
  NodeViewProps & {readOnly?: boolean, onResizeStop?: (view: EditorView) => void }) {
  readOnly = readOnly ?? false;

  // If there are no source for the node, return the image select component
  if (!node.attrs.src) {
    if (readOnly) {
      return <EmptyImageContainer readOnly={readOnly} isSelected={selected} />;
    }
    else {
      return (
        <ImageSelector
          autoOpen={true}
          onImageSelect={async (imageSrc) => {
            // const image = await imagePromise(imageSrc);
            updateAttrs({
              src: imageSrc
            });
          }}
        >
          <EmptyImageContainer readOnly={readOnly} isSelected={selected} />
        </ImageSelector>
      );
    }
  }

  const onDelete = useCallback(() => {
    updateAttrs({
      src: null,
      aspectRatio: 1
    });
  }, []);

  if (readOnly) {
    return (
      <StyledImage
        draggable={false}
        src={node.attrs.src}
        alt={node.attrs.alt}
        width={node.attrs.size}
        // height={node.attrs.size / aspectRatio}
      />
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
        <StyledImage
          draggable={false}
          src={node.attrs.src}
          alt={node.attrs.alt}
        />
      </Resizable>
    );
  }
}

export default memo(ResizableImage);
