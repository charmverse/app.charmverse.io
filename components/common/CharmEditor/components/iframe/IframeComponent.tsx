import type { RawSpecs } from '@bangle.dev/core';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import PreviewIcon from '@mui/icons-material/Preview';
import { ListItem, Typography } from '@mui/material';
import type { Node } from 'prosemirror-model';
import type { HTMLAttributes } from 'react';
import { useState, memo } from 'react';
import { FiFigma } from 'react-icons/fi';

import { MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT, MAX_EMBED_HEIGHT } from 'lib/embed/constants';
import { extractEmbedLink } from 'lib/embed/extractEmbedLink';

import BlockAligner from '../BlockAligner';
import { IframeContainer } from '../common/IframeContainer';
import type { CharmNodeViewProps } from '../nodeView/nodeView';
import VerticalResizer from '../Resizable/VerticalResizer';
import { extractTweetAttrs } from '../tweet/tweet';
import { extractYoutubeLinkType } from '../video/videoSpec';

import type { IFrameSelectorProps } from './IFrameSelector';
import IFrameSelector from './IFrameSelector';

const name = 'iframe';

export function iframeSpec(): RawSpecs {
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

const StyledEmptyIframeContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.5)};
  width: 100%;
  align-items: center;
  opacity: 0.5;
`;

function EmptyIframeContainer(
  props: HTMLAttributes<HTMLDivElement> & { readOnly: boolean; type: IFrameSelectorProps['type'] }
) {
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

function ResizableIframe({ readOnly, node, getPos, view, deleteNode, updateAttrs, onResizeStop }: CharmNodeViewProps) {
  const [height, setHeight] = useState(node.attrs.height);
  const figmaSrc = `https://www.figma.com/embed?embed_host=charmverse&url=${node.attrs.src}`;

  const autoOpen = node.marks.some((mark) => mark.type.name === 'tooltip-marker');

  // If there are no source for the node, return the image select component
  if (!node.attrs.src) {
    return readOnly ? (
      <EmptyIframeContainer type={node.attrs.type} readOnly={readOnly} />
    ) : (
      <IFrameSelector
        autoOpen={autoOpen}
        type={node.attrs.type}
        onIFrameSelect={(urlToEmbed) => {
          const tweetAttrs = extractTweetAttrs(urlToEmbed);
          const isYoutube = extractYoutubeLinkType(urlToEmbed);
          if (isYoutube) {
            const pos = getPos();
            const _node = view.state.schema.nodes.video.createAndFill({ src: urlToEmbed });
            view.dispatch(view.state.tr.replaceWith(pos, pos + node.nodeSize, _node));
          } else if (tweetAttrs) {
            const pos = getPos();
            const _node = view.state.schema.nodes.tweet.createAndFill(tweetAttrs);
            view.dispatch(view.state.tr.replaceWith(pos, pos + node.nodeSize, _node));
          } else {
            const attrs = extractEmbedLink(urlToEmbed);
            updateAttrs({
              src: attrs.url,
              type: attrs.type
            });
          }
        }}
      >
        <EmptyIframeContainer type={node.attrs.type} readOnly={readOnly} />
      </IFrameSelector>
    );
  }

  if (readOnly) {
    return (
      <IframeContainer>
        {node.attrs.type === 'figma' ? (
          <iframe
            allowFullScreen
            title='iframe'
            src={figmaSrc}
            style={{ height: '100%', border: '0 solid transparent', width: '100%' }}
          />
        ) : (
          <iframe
            allowFullScreen
            title='iframe'
            src={node.attrs.src}
            style={{ height: node.attrs.height ?? MIN_EMBED_HEIGHT, border: '0 solid transparent', width: '100%' }}
          />
        )}
      </IframeContainer>
    );
  }

  if (node.attrs.type === 'figma') {
    return (
      <BlockAligner onDelete={deleteNode}>
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
          <IframeContainer>
            <iframe
              allowFullScreen
              title='iframe'
              src={figmaSrc}
              style={{ height: '100%', border: '0 solid transparent', width: '100%' }}
            />
          </IframeContainer>
        </VerticalResizer>
      </BlockAligner>
    );
  } else {
    return (
      <BlockAligner onDelete={deleteNode}>
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
          <IframeContainer>
            <iframe
              allowFullScreen
              title='iframe'
              src={node.attrs.src}
              style={{ height: '100%', border: '0 solid transparent', width: '100%' }}
            />
          </IframeContainer>
        </VerticalResizer>
      </BlockAligner>
    );
  }
}

export default memo(ResizableIframe);
