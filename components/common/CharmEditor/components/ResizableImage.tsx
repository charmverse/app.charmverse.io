import type { NodeViewProps, RawSpecs } from '@bangle.dev/core';
import { Plugin } from '@bangle.dev/core';
import type { EditorState, EditorView, Node, Slice, Transaction } from '@bangle.dev/pm';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import ImageIcon from '@mui/icons-material/Image';
import { Box, ListItem, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import type { HTMLAttributes } from 'react';
import { memo, useCallback, useState } from 'react';
import { v4 } from 'uuid';

import ImageSelector from 'components/common/ImageSelector/ImageSelector';
import LoadingComponent from 'components/common/LoadingComponent';
import { uploadToS3 } from 'lib/aws/uploadToS3Browser';
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

function EmptyImageContainer ({ readOnly, isSelected, ...props }: HTMLAttributes<HTMLDivElement> & { readOnly: boolean, isSelected?: boolean }) {
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

const StyledImageContainer = styled.div<{ size: number }>`
  max-width: 100%;
  width: ${({ size }) => size}px;
  margin: 0 auto;
`;

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
        },
        track: {
          default: []
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

interface ResizableImageProps extends NodeViewProps {
  readOnly?: boolean;
  onResizeStop?: (view: EditorView) => void;
}

function ResizableImage ({ readOnly = false, onResizeStop, node, updateAttrs, selected }: ResizableImageProps) {

  const imageSource = node.attrs.src;

  const [uploadingImage, setUploadingImage] = useState(false);

  const [uploadFailed, setUploadFailed] = useState(false);

  const onDelete = useCallback(() => {
    updateAttrs({
      src: null,
      aspectRatio: 1
    });
  }, []);

  // If there are no source for the node, return the image select component
  if (!imageSource) {
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
  else if (imageSource.startsWith('data') && !uploadingImage && !readOnly && onResizeStop && !uploadFailed) {
    setUploadingImage(true);

    const fileExtension = imageSource.split('image/')[1].split(';')[0];
    const fileName = `${v4()}.${fileExtension}`;

    const rawFileContent = imageSource.split(';base64,')[1];

    const fileContent = Buffer.from(rawFileContent, 'base64');

    // Break the buffer string into chunks of 1 kilobyte
    const chunkSize = 1024 * 1;

    const bufferLength = fileContent.length;

    const bufferChunks = [];

    for (let i = 0; i < bufferLength; i += chunkSize) {
      const chunk = fileContent.slice(i, i + chunkSize);
      bufferChunks.push(chunk);
    }

    const file: File = new File(bufferChunks, fileName, { type: `image/${fileExtension}` });

    uploadToS3(file)
      .then(({ url }) => {
        updateAttrs({
          src: url
        });
      })
      .catch(() => {
        setUploadFailed(true);
      })
      .finally(() => {
        setUploadingImage(false);
      });
  }
  if (uploadFailed) {
    return <Alert severity='warning'>Image upload failed</Alert>;
  }
  else if (uploadingImage) {
    return <LoadingComponent isLoading label='Uploading' />;
  }
  else if (readOnly) {
    return (
      <StyledImageContainer size={node.attrs.size}>
        <StyledImage
          draggable={false}
          src={node.attrs.src}
          alt={node.attrs.alt}
          width={node.attrs.size}
        />
      </StyledImageContainer>
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
