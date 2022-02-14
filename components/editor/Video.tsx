import { NodeViewProps, RawSpecs } from '@bangle.dev/core';
import { Node } from '@bangle.dev/pm';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import { ListItem, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { HTMLAttributes } from 'react';

const name = 'video';

export function videoSpec (): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      inline: true,
      attrs: {
        src: {
          default: null
        }
      },
      draggable: true,
      parseDOM: [
        {
          tag: 'video[src]',
          getAttrs: (dom: any) => ({
            src: dom.getAttribute('src')
          })
        }
      ],
      toDOM: (node: Node) => {
        return ['video', node.attrs];
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
      <StyledEmptyVideoContainer>
        <VideoLibraryIcon fontSize='small' />
        <Typography>
          Embed a video
        </Typography>
      </StyledEmptyVideoContainer>
    </ListItem>
  );
}

export default function Video ({ node, updateAttrs }: NodeViewProps) {
  // If there are no source for the node, return the image select component
  if (!node.attrs.src) {
    return <EmptyImageContainer />;
  }
  return null;
}
