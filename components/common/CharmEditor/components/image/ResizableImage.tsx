import { log } from '@charmverse/core/log';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import ImageIcon from '@mui/icons-material/Image';
import { Box, ListItem, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import type { Node } from 'prosemirror-model';
import type { HTMLAttributes } from 'react';
import { memo, useEffect, useRef, useState } from 'react';

import ImageSelector from 'components/common/ImageSelector/ImageSelector';
import LoadingComponent from 'components/common/LoadingComponent';
import { uploadToS3 } from 'lib/aws/uploadToS3Browser';
import { MAX_IMAGE_WIDTH, MIN_IMAGE_WIDTH } from 'lib/prosemirror/plugins/image/constants';
import { replaceS3Domain } from 'lib/utils/url';

import { enableDragAndDrop } from '../../utils';
import { getFileBinary } from '../@bangle.dev/base-components/image';
import BlockAligner from '../BlockAligner';
import type { CharmNodeViewProps } from '../nodeView/nodeView';
import Resizable from '../Resizable/Resizable';

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
  margin: ${({ theme }) => theme.spacing(0.5)} auto;
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

function ResizableImage({
  readOnly = false,
  getPos,
  view,
  deleteNode,
  node,
  updateAttrs,
  selected
}: CharmNodeViewProps) {
  const imageSource = node.attrs.src as string | undefined;
  const autoOpen = node.marks.some((mark) => mark.type.name === 'tooltip-marker');
  const imageRef = useRef<HTMLElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [uploadFailed, setUploadFailed] = useState(false);

  function onDelete() {
    const start = getPos();
    if (typeof start === 'number') {
      const end = start + 1;
      view.dispatch(view.state.tr.deleteRange(start, end));
    }
  }

  useEffect(() => {
    if (imageSource && !readOnly) {
      const file = getFileBinary(imageSource);
      if (file) {
        setUploadingImage(true);
        // Scroll to the image while it's uploading
        setTimeout(() => {
          if (imageRef.current) {
            imageRef.current.scrollIntoView({
              behavior: 'smooth'
            });
          }
        }, 0);
        uploadToS3(file)
          .then(({ url }) => {
            updateAttrs({
              src: url
            });
          })
          .catch((error) => {
            log.error('Could not upload image', { imageSource: imageSource.slice(0, 100), error });
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
    }
    return (
      <ImageSelector
        autoOpen={autoOpen}
        onImageSelect={async (imageSrc) => {
          updateAttrs({
            src: imageSrc
          });
        }}
      >
        <EmptyImageContainer onDelete={deleteNode} readOnly={readOnly} isSelected={selected} />
      </ImageSelector>
    );
  } else if (uploadFailed) {
    return <Alert severity='warning'>Image upload failed</Alert>;
  }

  return (
    <Box ref={imageRef}>
      {uploadingImage ? (
        <Box my={1}>
          <LoadingComponent size={24} isLoading label='Uploading' />
        </Box>
      ) : readOnly ? (
        <StyledImageContainer size={node.attrs.size}>
          <StyledImage
            draggable={false}
            src={replaceS3Domain(node.attrs.src)}
            alt={node.attrs.alt}
            width={node.attrs.size}
          />
        </StyledImageContainer>
      ) : (
        <Resizable
          initialSize={node.attrs.size}
          minWidth={MIN_IMAGE_WIDTH}
          updateAttrs={updateAttrs}
          onDelete={onDelete}
        >
          <StyledImage
            onDragStart={() => {
              const nodePos = getPos();
              if (typeof nodePos === 'number') {
                enableDragAndDrop(view, nodePos);
              }
            }}
            src={replaceS3Domain(node.attrs.src)}
            alt={node.attrs.alt}
          />
        </Resizable>
      )}
    </Box>
  );
}

export default memo(ResizableImage);
