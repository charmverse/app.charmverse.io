import type { RawSpecs } from '@bangle.dev/core';
import type { Node } from '@bangle.dev/pm';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import ImageIcon from '@mui/icons-material/Image';
import { Box, ListItem, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import type { HTMLAttributes } from 'react';
import { memo, useEffect, useState } from 'react';
import { v4 } from 'uuid';

import ImageSelector from 'components/common/ImageSelector/ImageSelector';
import LoadingComponent from 'components/common/LoadingComponent';
import { uploadToS3 } from 'lib/aws/uploadToS3Browser';
import { MAX_IMAGE_WIDTH, MIN_IMAGE_WIDTH } from 'lib/prosemirror/plugins/image/constants';

import * as suggestTooltip from './@bangle.dev/tooltip/suggest-tooltip';
import BlockAligner from './BlockAligner';
import type { CharmNodeViewProps } from './nodeView/nodeView';
import Resizable from './Resizable/Resizable';

const StyledEmptyImageContainer = styled(Box)`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.5)};
  width: 100%;
  align-items: center;
  opacity: 0.5;
`;

function EmptyImageContainer({
  onDelete,
  isSelected,
  readOnly,
  ...props
}: HTMLAttributes<HTMLDivElement> & { onDelete: () => void; readOnly: boolean; isSelected?: boolean }) {
  const theme = useTheme();

  return (
    <BlockAligner readOnly={readOnly} onDelete={onDelete}>
      <ListItem
        button
        disableTouchRipple
        sx={{
          backgroundColor: isSelected ? 'var(--charmeditor-active)' : theme.palette.background.light,
          p: 2,
          display: 'flex'
        }}
        {...props}
      >
        <StyledEmptyImageContainer>
          <ImageIcon fontSize='small' />
          <Typography>Add an image</Typography>
        </StyledEmptyImageContainer>
      </ListItem>
    </BlockAligner>
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

function imageSpec(): RawSpecs {
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
          const toWrite = `[](${src})`;
          state.text(toWrite, false);
          state.ensureNewLine();
        }
      }
    }
  };
}
function ResizableImage({
  readOnly = false,
  getPos,
  view,
  deleteNode,
  node,
  updateAttrs,
  selected
}: CharmNodeViewProps) {
  const imageSource = node.attrs.src;
  const autoOpen = node.marks.some((mark) => mark.type.name === 'tooltip-marker');

  const [uploadingImage, setUploadingImage] = useState(false);

  const [uploadFailed, setUploadFailed] = useState(false);

  function onDelete() {
    const start = getPos();
    const end = start + 1;
    view.dispatch(view.state.tr.deleteRange(start, end));
  }

  useEffect(() => {
    if (imageSource && !readOnly) {
      const file = getFileBinary(imageSource);
      if (file) {
        setUploadingImage(true);
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
    }
  }, [imageSource, readOnly]);

  // If there are no source for the node, return the image select component
  if (!imageSource) {
    if (readOnly) {
      return <div />;
    } else {
      return (
        <ImageSelector
          autoOpen={autoOpen}
          onImageSelect={async (imageSrc) => {
            // const image = await imagePromise(imageSrc);
            updateAttrs({
              src: imageSrc
            });
          }}
        >
          <EmptyImageContainer onDelete={deleteNode} readOnly={readOnly} isSelected={selected} />
        </ImageSelector>
      );
    }
  } else if (uploadFailed) {
    return <Alert severity='warning'>Image upload failed</Alert>;
  } else if (uploadingImage) {
    return <LoadingComponent isLoading label='Uploading' />;
  } else if (readOnly) {
    return (
      <StyledImageContainer size={node.attrs.size}>
        <StyledImage draggable={false} src={node.attrs.src} alt={node.attrs.alt} width={node.attrs.size} />
      </StyledImageContainer>
    );
  } else {
    return (
      <Resizable initialSize={node.attrs.size} minWidth={MIN_IMAGE_WIDTH} updateAttrs={updateAttrs} onDelete={onDelete}>
        <StyledImage draggable={false} src={node.attrs.src} alt={node.attrs.alt} />
      </Resizable>
    );
  }
}

// example: <img src=”data:image/gif;base64, R0lGODlhCAAFAIABAMaAgP///yH5BAEAAAEALAAAAAAIAAUAAAIKBBKGebzqoJKtAAA7″ />
// does not work for svg sources: data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27379%27%20height=%27820%27/%3e
function getFileBinary(src: string): File | null {
  if (src.startsWith('data')) {
    const contentType = src.split('image/')[1].split(';')[0];
    const fileExtension = contentType.split('+')[0]; // handle svg+xml
    const fileName = `${v4()}.${fileExtension}`;
    const rawFileContent = src.split(';base64,')[1];
    // not all data sources are base64, like svg:
    if (rawFileContent) {
      const fileContent = Buffer.from(rawFileContent, 'base64');

      // Break the buffer string into chunks of 1 kilobyte
      const chunkSize = 1024 * 1;

      const bufferLength = fileContent.length;

      const bufferChunks = [];

      for (let i = 0; i < bufferLength; i += chunkSize) {
        const chunk = fileContent.slice(i, i + chunkSize);
        bufferChunks.push(chunk);
      }

      const file: File = new File(bufferChunks, fileName, { type: `image/${contentType}` });
      return file;
    }
  }
  return null;
}

export function spec() {
  // this is a dummy marker to let us know to show the image selector
  const tooltipSpec = suggestTooltip.spec({ markName: 'tooltip-marker', trigger: 'image', excludes: '_' });
  tooltipSpec.schema.inclusive = false;
  return [tooltipSpec, imageSpec()];
}

export default memo(ResizableImage);
