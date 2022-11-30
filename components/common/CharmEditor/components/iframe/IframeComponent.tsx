import type { RawSpecs } from '@bangle.dev/core';
import PreviewIcon from '@mui/icons-material/Preview';
import type { Node } from 'prosemirror-model';
import { useState, memo } from 'react';
import { FiFigma } from 'react-icons/fi';

import { MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT, MAX_EMBED_HEIGHT } from 'lib/embed/constants';
import { extractEmbedLink } from 'lib/embed/extractEmbedLink';

import BlockAligner from '../BlockAligner';
import { EmbeddedInputPopup } from '../common/EmbeddedInputPopup';
import { EmbeddedUrl } from '../common/EmbeddedUrl';
import { IframeContainer } from '../common/IframeContainer';
import type { CharmNodeViewProps } from '../nodeView/nodeView';
import VerticalResizer from '../Resizable/VerticalResizer';
import { extractTweetAttrs } from '../tweet/tweet';
import { extractYoutubeLinkType } from '../video/videoSpec';

const name = 'iframe';

export function iframeSpec(): RawSpecs {
  return {
    type: 'node',
    name,
    markdown: {
      toMarkdown: (state, node) => {
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

function ResizableIframe({ readOnly, node, getPos, view, deleteNode, updateAttrs, onResizeStop }: CharmNodeViewProps) {
  const [height, setHeight] = useState(node.attrs.height);
  const figmaSrc = `https://www.figma.com/embed?embed_host=charmverse&url=${node.attrs.src}`;

  // If there are no source for the node, return the image select component
  if (!node.attrs.src) {
    if (readOnly) {
      return <div />;
    }
    const embedIcon =
      node.attrs.type === 'figma' ? <FiFigma style={{ fontSize: 'small' }} /> : <PreviewIcon fontSize='small' />;
    const embedText = node.attrs.type === 'figma' ? 'Embed a Figma' : 'Insert an embed';
    return (
      <EmbeddedInputPopup node={node} embedIcon={embedIcon} embedText={embedText}>
        <EmbeddedUrl
          onSubmit={(urlToEmbed) => {
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
          placeholder={node.attrs.type === 'figma' ? 'https://www.figma.com/file...' : 'https://...'}
        />
      </EmbeddedInputPopup>
    );
  }

  if (readOnly) {
    const src = node.attrs.type === 'figma' ? figmaSrc : node.attrs.src;
    return (
      <IframeContainer>
        <iframe
          allowFullScreen
          title='iframe'
          src={src}
          style={{ height: node.attrs.height ?? MIN_EMBED_HEIGHT, border: '0 solid transparent', width: '100%' }}
        />
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
