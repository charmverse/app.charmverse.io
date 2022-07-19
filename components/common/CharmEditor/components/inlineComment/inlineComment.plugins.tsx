import { Plugin, RawPlugins } from '@bangle.dev/core';
import { PluginKey, EditorState, EditorView, Node, Schema } from '@bangle.dev/pm';
import { createTooltipDOM, tooltipPlacement } from '@bangle.dev/tooltip';
import { highlightMarkedElement, highlightElement } from 'lib/prosemirror/highlightMarkedElement';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { extractInlineCommentRows } from 'lib/inline-comments/findTotalInlineComments';
import reactDOM from 'react-dom';
import { referenceElement } from '../@bangle.dev/tooltip/suggest-tooltip';
import { markName } from './inlineComment.constants';
import RowIcon from './components/RowIcon';

export interface InlineCommentPluginState {
  tooltipContentDOM: HTMLElement
  show: boolean
  ids: string[]
}

export function plugin ({ key } :{
  key: PluginKey
}): RawPlugins {
  const tooltipDOMSpec = createTooltipDOM();
  return [
    new Plugin<InlineCommentPluginState>({
      state: {
        init () {
          return {
            show: false,
            tooltipContentDOM: tooltipDOMSpec.contentDOM,
            ids: []
          };
        },
        apply (tr, pluginState) {
          const meta = tr.getMeta(key);
          if (meta === undefined) {
            return pluginState;
          }
          if (meta.type === 'RENDER_TOOLTIP') {
            return {
              ...pluginState,
              ...meta.value,
              show: true
            };
          }
          if (meta.type === 'HIDE_TOOLTIP') {
            // Do not change object reference if show was and is false
            if (pluginState.show === false) {
              return pluginState;
            }
            return {
              ...pluginState,
              ids: [],
              show: false
            };
          }
          throw new Error('Unknown type');
        }
      },
      key,
      props: {
        handleClick: (view: EditorView, pos: number, event: MouseEvent) => {
          if (/charm-inline-comment/.test((event.target as HTMLElement).className)) {
            return highlightMarkedElement({
              view,
              elementId: 'page-thread-list-box',
              key,
              markName,
              prefix: 'thread'
            });
          }
          return false;
        }
      }
    }),
    tooltipPlacement.plugins({
      stateKey: key,
      renderOpts: {
        placement: 'bottom',
        tooltipDOMSpec,
        getReferenceElement: referenceElement(key, (state) => {
          const { selection } = state;
          return {
            end: selection.to,
            start: selection.from
          };
        })
      }
    }),
    new Plugin({
      state: {
        init (_, { doc, schema }) {
          return commentDecorations({ schema, doc });
        },
        apply (tr, old, _, editorState) {
          return tr.docChanged ? commentDecorations({ schema: editorState.schema, doc: tr.doc }) : old;
        }
      },
      props: {
        decorations (state: EditorState) {
          return this.getState(state);
        },
        handleClick: (view: EditorView, pos: number, event: MouseEvent) => {
          const inlineCommentParent = (event.target as HTMLElement)?.closest('.charm-comment-count');
          const ids = inlineCommentParent?.getAttribute('data-ids')?.split(',') || [];
          if (ids.length > 0) {
            return highlightElement({
              id: ids[0],
              view,
              elementId: 'page-thread-list-box',
              key,
              markName,
              prefix: 'thread'
            });
          }
          return false;
        }
      }
    })
  ];
}

// TODO: group comments on the same line somehow
function commentDecorations ({ schema, doc }: { doc: Node, schema: Schema }) {
  const decos: Decoration[] = [];
  const inlineComments = extractInlineCommentRows(schema, doc);
  // console.log('inlineComments', inlineComments);
  inlineComments.forEach(comments => {
    if (comments.length > 0) {
      const firstPos = comments[0].pos;
      // console.log('firstPos', firstPos);
      decos.push(
        Decoration.widget(firstPos, () => renderComponent(comments.map(_ => _.node)), { key: firstPos.toString() })
      );
    }
  });
  return DecorationSet.create(doc, decos);
}

function renderComponent (nodes: Node[]) {
  const container = document.createElement('div');
  container.className = 'charm-comment-count';
  const threadIds = nodes.map(node => node.marks[0]?.attrs.id).filter(Boolean);
  // console.log('threadIds', threadIds);
  container.setAttribute('data-ids', threadIds.join(','));

  reactDOM.render(<RowIcon threadIds={threadIds} />, container);
  return container;
}
