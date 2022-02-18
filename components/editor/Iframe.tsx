import { NodeViewProps, Plugin, RawSpecs } from '@bangle.dev/core';
import { EditorState, EditorView, Node, Schema, Slice, Transaction } from '@bangle.dev/pm';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import { ListItem, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { HTMLAttributes } from 'react';
import BlockAligner from './BlockAligner';
import IFrameSelector from './IFrameSelector';
import Resizer from './Resizer';

const name = 'iframe';

function extractEmbedLink (url: string) {
  const isYoutubeLink = url.match(/(?:https:\/\/www.youtube.com\/watch\?v=(.*)|https:\/\/youtu.be\/(.*))/);
  const isIframeEmbed = url.startsWith('<iframe ');
  let embedUrl: null | string = null;

  if (isYoutubeLink) {
    /* eslint-disable-next-line */
    embedUrl = `https://www.youtube.com/embed/${isYoutubeLink[1] ?? isYoutubeLink[2]}`;
  }
  else if (isIframeEmbed) {
    const indexOfSrc = url.indexOf('src');
    const indexOfFirstQuote = url.indexOf('"', indexOfSrc);
    const indexOfLastQuote = url.indexOf('"', indexOfFirstQuote + 1);
    embedUrl = url.slice(indexOfFirstQuote + 1, indexOfLastQuote);
  }

  return embedUrl;
}

interface DispatchFn {
  (tr: Transaction): void;
}

// inject a real iframe node when pasting embed codes

export const iframePlugin = new Plugin({
  props: {
    handlePaste: (view: EditorView, rawEvent: ClipboardEvent, slice: Slice) => {
      // @ts-ignore
      const contentRow = slice.content.content?.[0].content.content;
      const embedUrl = extractEmbedLink(contentRow?.[0]?.text);
      if (embedUrl) {
        insertIframeNode(view.state, view.dispatch, view, { src: embedUrl });
        return true;
      }
      return false;
    }
  }
});

const getTypeFromSchema = (schema: Schema) => schema.nodes[name];

function insertIframeNode (state: EditorState, dispatch: DispatchFn, view: EditorView, attrs?: { [key: string]: any }) {
  const type = getTypeFromSchema(state.schema);
  const newTr = type.create(attrs);
  const { tr } = view.state;
  const cursorPosition = state.selection.$head.pos;
  tr.insert(cursorPosition, newTr);
  if (dispatch) {
    dispatch(state.tr.replaceSelectionWith(newTr));
  }
}

export function iframeSpec (): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        src: {
          default: ''
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

const StyledEmptyIFrameContainer = styled(Box)`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.5)};
  width: 100%;
  align-items: center;
  opacity: 0.5;
`;

function EmptyIFrameContainer (props: HTMLAttributes<HTMLDivElement> & {type: 'video' | 'embed'}) {
  const theme = useTheme();
  const { type, ...rest } = props;
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
      {...rest}
    >
      <StyledEmptyIFrameContainer>
        {type === 'embed' ? <svg viewBox='0 0 30 30' className='compass' height='1em' width='1em' style={{ display: 'block', fill: 'currentColor', flexShrink: 0, backfaceVisibility: 'hidden' }}><path d='M18,4.361V3c0-1.657-1.343-3-3-3s-3,1.343-3,3v1.361C6.27,5.718,2,10.854,2,17c0,7.18,5.82,13,13,13s13-5.82,13-13 C28,10.854,23.73,5.718,18,4.361z M14,3c0-0.552,0.448-1,1-1s1,0.448,1,1v1.051C15.669,4.025,15.338,4,15,4s-0.669,0.025-1,0.051V3z M16,27.949V26h-2v1.949C8.724,27.474,4.526,23.276,4.051,18H6v-2H4.051C4.526,10.724,8.724,6.526,14,6.051V8h2V6.051 c5.276,0.476,9.474,4.673,9.949,9.949H24v2h1.949C25.474,23.276,21.276,27.474,16,27.949z M8,24l10-4l4-10l-10,4L8,24z M18.41,13.59 l-1.949,4.871L11.59,20.41l1.949-4.871L18.41,13.59z' /></svg> : <VideoLibraryIcon fontSize='small' /> }
        <Typography>
          {type === 'video' ? 'Insert a video' : 'Insert an embed'}
        </Typography>
      </StyledEmptyIFrameContainer>
    </ListItem>
  );
}

const StyledIFrame = styled(Box)`
  object-fit: contain;
  width: 100%;
  min-height: 250px;
  user-select: none;
  &:hover {
    cursor: initial;
  }
  border-radius: ${({ theme }) => theme.spacing(1)};
`;

export default function IFrame ({ node, updateAttrs }: NodeViewProps) {
  const theme = useTheme();
  // If there are no source for the node, return the image select component
  if (!node.attrs.src) {
    return (
      <IFrameSelector
        type={node.attrs.type}
        onIFrameSelect={(videoLink) => {
          updateAttrs({
            src: extractEmbedLink(videoLink)
          });
        }}
      >
        <EmptyIFrameContainer type={node.attrs.type} />
      </IFrameSelector>
    );
  }

  return (
    <Box style={{
      margin: theme.spacing(3, 0),
      display: 'flex',
      flexDirection: 'column'
    }}
    >
      <BlockAligner onDelete={() => {
        updateAttrs({
          src: null
        });
      }}
      >
        <Resizer initialSize={1.77 * 250} maxSize={750} minSize={1.77 * 250} aspectRatio={1.77}>
          <StyledIFrame>
            <iframe allowFullScreen title='iframe' src={node.attrs.src} style={{ height: '100%', border: '0 solid transparent', width: '100%' }} />
          </StyledIFrame>
        </Resizer>
      </BlockAligner>
    </Box>
  );
}
