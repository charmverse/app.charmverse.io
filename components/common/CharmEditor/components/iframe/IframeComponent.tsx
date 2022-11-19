import type { NodeViewProps, RawSpecs } from '@bangle.dev/core';
import type { EditorView, Node } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import PreviewIcon from '@mui/icons-material/Preview';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import { ListItem, Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { HTMLAttributes } from 'react';
import { useState, memo } from 'react';
import { FiFigma } from 'react-icons/fi';

import { MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT, MAX_EMBED_HEIGHT, VIDEO_ASPECT_RATIO, MIN_EMBED_WIDTH } from 'lib/embed/constants';
import { extractEmbedLink } from 'lib/embed/extractEmbedLink';

import BlockAligner from '../BlockAligner';
import Resizable from '../Resizable';
import VerticalResizer from '../Resizable/VerticalResizer';

import type { IFrameSelectorProps } from './IFrameSelector';
import IFrameSelector from './IFrameSelector';

const name = 'iframe';

export function iframeSpec (): RawSpecs {
  return {
    type: 'node',
    name,
    markdown: {
      toMarkdown: (state, node, parent, index) => {

        // eslint-disable-next-line prefer-const
        let { height, width, src } = node.attrs;

        if (height && width && src) {
          height = parseInt(height);
          width = parseInt(width);

          const attributesToWrite = ` width=${width}px height=${height}px src=${src} `;

          const toRender = `\r\n<iframe ${attributesToWrite}></iframe>\r\n\r\n\r\n`;

          // Ensure markdown html will be separated by newlines
          state.ensureNewLine();
          state.text(toRender);
          state.ensureNewLine();
        }
      }
    },
    schema: {
      attrs: {
        src: {
          default: ''
        },
        width: {
          default: MAX_EMBED_WIDTH
        },
        height: {
          default: MIN_EMBED_HEIGHT
        },
        // Type of iframe, it could either be video or embed
        type: {
          default: 'embed'
        }
      },
      group: 'block',
      inline: false,
      draggable: false,
      isolating: true, // dont allow backspace to delete
      parseDOM: [
        {
          tag: 'iframe',
          getAttrs: (dom: any) => {
            return {
              src: dom.getAttribute('src')
            };
          }
        }
      ],
      toDOM: (node: Node) => {
        return ['iframe', { class: 'ns-embed', style: `height: ${node.attrs.height};`, ...node.attrs }];
      }
    }
  };
}

const StyledEmptyIframeContainer = styled(Box)`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.5)};
  width: 100%;
  align-items: center;
  opacity: 0.5;
`;

function EmptyIframeContainer (props: HTMLAttributes<HTMLDivElement> & { readOnly: boolean, type: IFrameSelectorProps['type'] }) {
  const theme = useTheme();
  const { type, readOnly, ...rest } = props;
  return (
    <ListItem
      button
      disableRipple
      disabled={readOnly}
      sx={{
        backgroundColor: theme.palette.background.light,
        p: 2,
        display: 'flex',
        borderRadius: theme.spacing(0.5),
        my: 0.5
      }}
      {...rest}
    >
      <StyledEmptyIframeContainer>
        {(() => {
          switch (type) {
            case 'embed':
              return <PreviewIcon fontSize='small' />;
            case 'video':
              return <VideoLibraryIcon fontSize='small' />;
            case 'figma':
              return <FiFigma style={{ fontSize: 'small' }} />;

            default:
              return null;
          }
        })()}
        <Typography>
          {(() => {
            switch (type) {
              case 'embed':
                return 'Insert an embed';
              case 'video':
                return 'Insert a video';
              case 'figma':
                return 'Insert a Figma';

              default:
                return null;
            }
          })()}

        </Typography>
      </StyledEmptyIframeContainer>
    </ListItem>
  );
}

const StyledIFrame = styled(Box)`
  object-fit: contain;
  width: 100%;
  height: 100%;
  user-select: none;
  &:hover {
    cursor: initial;
  }
  border-radius: ${({ theme }) => theme.spacing(1)};
`;

function ResizableIframe ({ readOnly, node, updateAttrs, onResizeStop }:
  NodeViewProps & { readOnly: boolean, onResizeStop?: (view: EditorView) => void }) {
  const [height, setHeight] = useState(node.attrs.height);
  const view = useEditorViewContext();
  const figmaSrc = `https://www.figma.com/embed?embed_host=charmverse&url=${node.attrs.src}`;

  const autoOpen = node.marks.some(mark => mark.type.name === 'tooltip-marker');

  // If there are no source for the node, return the image select component
  if (!node.attrs.src) {
    return readOnly ? <EmptyIframeContainer type={node.attrs.type} readOnly={readOnly} /> : (
      <IFrameSelector
        autoOpen={autoOpen}
        type={node.attrs.type}
        onIFrameSelect={(videoLink) => {
          const attrs = extractEmbedLink(videoLink);
          updateAttrs({
            src: attrs.url,
            type: attrs.type
          });
        }}
      >
        <EmptyIframeContainer type={node.attrs.type} readOnly={readOnly} />
      </IFrameSelector>
    );
  }

  function onDelete () {
    updateAttrs({
      src: null
    });
  }

  if (readOnly) {
    return (
      <StyledIFrame>
        {node.attrs.type === 'figma' ? (
          <iframe allowFullScreen title='iframe' src={figmaSrc} style={{ height: '100%', border: '0 solid transparent', width: '100%' }} />
        ) : (
          <iframe allowFullScreen title='iframe' src={node.attrs.src} style={{ height: node.attrs.size ?? MIN_EMBED_HEIGHT, border: '0 solid transparent', width: '100%' }} />
        )}
      </StyledIFrame>
    );
  }

  if (node.attrs.type === 'embed') {
    return (
      <BlockAligner onDelete={onDelete}>
        <VerticalResizer
          onResizeStop={(_, data) => {
            updateAttrs({
              height: data.size.height
            });
            if (onResizeStop) {
              onResizeStop(view);
            }
          }}
          width={node.attrs.width}
          height={height}
          onResize={(_, data) => {
            setHeight(data.size.height);
          }}
          maxConstraints={[MAX_EMBED_WIDTH, MAX_EMBED_HEIGHT]}
          minConstraints={[MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT]}
        >
          <StyledIFrame>
            <iframe allowFullScreen title='iframe' src={node.attrs.src} style={{ height: '100%', border: '0 solid transparent', width: '100%' }} />
          </StyledIFrame>
        </VerticalResizer>
      </BlockAligner>
    );
  }
  else if (node.attrs.type === 'figma') {
    return (
      <BlockAligner onDelete={onDelete}>
        <VerticalResizer
          onResizeStop={(_, data) => {
            updateAttrs({
              height: data.size.height
            });
            if (onResizeStop) {
              onResizeStop(view);
            }
          }}
          width={node.attrs.width}
          height={height}
          onResize={(_, data) => {
            setHeight(data.size.height);
          }}
          maxConstraints={[MAX_EMBED_WIDTH, MAX_EMBED_HEIGHT]}
          minConstraints={[MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT]}
        >
          <StyledIFrame>
            <iframe allowFullScreen title='iframe' src={figmaSrc} style={{ height: '100%', border: '0 solid transparent', width: '100%' }} />
          </StyledIFrame>
        </VerticalResizer>
      </BlockAligner>
    );
  }
  else {
    return (
      <Resizable
        aspectRatio={VIDEO_ASPECT_RATIO}
        initialSize={node.attrs.width}
        minWidth={MIN_EMBED_WIDTH}
        updateAttrs={args => {
          updateAttrs({ width: args.size });
        }}
        onDelete={onDelete}
        onResizeStop={onResizeStop}
      >
        <StyledIFrame>
          <iframe allowFullScreen title='iframe' src={node.attrs.src} style={{ height: '100%', border: '0 solid transparent', width: '100%' }} />
        </StyledIFrame>
      </Resizable>
    );
  }
}

export default memo(ResizableIframe);
