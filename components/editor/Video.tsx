import { NodeViewProps, RawSpecs } from '@bangle.dev/core';
import { Node } from '@bangle.dev/pm';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import { ListItem, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { HTMLAttributes } from 'react';
import BlockAligner from './BlockAligner';
import Resizer from './Resizer';
import VideoSelector from './VideoSelector';

const name = 'video';

export function videoSpec (): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        src: {
          default: null
        }
      },
      group: 'block',
      draggable: true,
      parseDOM: [
        {
          tag: 'iframe[src]',
          getAttrs: (dom: any) => ({
            src: dom.getAttribute('src')
          })
        }
      ],
      toDOM: (node: Node) => {
        return ['iframe', node.attrs];
      }
    }
  };
}

const StyledEmptyVideoContainer = styled(Box)`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.5)};
  width: 100%;
  align-items: center;
  opacity: 0.5;
`;

function EmptyVideoContainer (props: HTMLAttributes<HTMLDivElement>) {
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
      <StyledEmptyVideoContainer>
        <VideoLibraryIcon fontSize='small' />
        <Typography>
          Embed a video
        </Typography>
      </StyledEmptyVideoContainer>
    </ListItem>
  );
}

const StyledVideo = styled.iframe`
  object-fit: contain;
  width: 100%;
  min-height: 250px;
  user-select: none;
  &:hover {
    cursor: initial;
  }
  border-radius: ${({ theme }) => theme.spacing(1)};
`;

export default function Video ({ node, updateAttrs }: NodeViewProps) {
  // If there are no source for the node, return the image select component
  if (!node.attrs.src) {
    return (
      <VideoSelector onVideoSelect={(videoLink) => {
        updateAttrs({
          src: videoLink
        });
      }}
      >
        <EmptyVideoContainer />
      </VideoSelector>
    );
  }

  return (
    <BlockAligner onDelete={() => {
      updateAttrs({
        src: null
      });
    }}
    >
      <Resizer maxWidth={750} minWidth={250}>
        <StyledVideo
          draggable={false}
          src={node.attrs.src}
          title='YouTube video player'
          frameBorder='0'
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
          allowFullScreen
        />
      </Resizer>
    </BlockAligner>
  );
}
