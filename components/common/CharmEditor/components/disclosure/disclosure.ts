import type { RawPlugins, RawSpecs } from '@bangle.dev/core';
import { createElement } from '@bangle.dev/core';
import type { DOMOutputSpec } from '@bangle.dev/pm';
import { Plugin, PluginKey, keymap, TextSelection } from '@bangle.dev/pm';
import { hasParentNodeOfType } from '@bangle.dev/utils';

import { backspaceCmd } from './commands';

export function spec () {
  return [
    summarySpec(),
    detailsSpec()
  ];
}

function summarySpec (): RawSpecs {
  return {
    type: 'node',
    name: 'disclosureSummary',
    schema: {
      content: '(paragraph | heading)',
      group: 'block',
      parseDOM: [{ tag: 'summary' }],
      toDOM: (): DOMOutputSpec => {
        return ['summary'];
      }
    },
    markdown: {
      toMarkdown: () => null
    }
  };
}

function detailsSpec (): RawSpecs {
  return {
    type: 'node',
    name: 'disclosureDetails',
    schema: {
      content: 'disclosureSummary block+',
      defining: true,
      group: 'block',
      parseDOM: [{ tag: 'details' }],
      toDOM: (): DOMOutputSpec => {
        return ['details', 0];
      }
    },
    markdown: {
      toMarkdown: () => null
    }
  };
}

export function plugins (): RawPlugins {
  return () => {
    return [
      keymap({
        Backspace: backspaceCmd
        // Enter: moveDownCmd
      }),
      ContainerPlugin({ type: 'disclosureSummary', contentDOM: ['summary'] }),
      ContainerPlugin({ type: 'disclosureDetails', contentDOM: ['details'] })
    ];
  };
}

function ContainerPlugin ({ type, contentDOM }: { type: string, contentDOM: DOMOutputSpec }) {
  return new Plugin({
    key: new PluginKey(`${type}-NodeView`),
    props: {
      handleDOMEvents: {
        // listen to 'space bar' and disable action or else Firefox will toggle the details
        keyup: (view, event) => {
          if (event.key === ' ') {
            event.preventDefault();
            return true;
          }
          return false;
        },
        // disable toggle effect unelss user is clicking the toggle element
        click: (view, event) => {
          const coordinates = view.posAtCoords({
            left: event.clientX,
            top: event.clientY
          });
          if (!coordinates || !(event.target instanceof Element)) {
            return false;
          }
          const selection = new TextSelection(view.state.doc.resolve(coordinates.pos));
          const isInsideSummary = hasParentNodeOfType(view.state.schema.nodes.disclosureSummary)(selection);
          const targetEdge = event.target.getBoundingClientRect().left;
          const distanceFromEdge = event.clientX - targetEdge;
          if (isInsideSummary && distanceFromEdge > 20) {
            event.stopPropagation();
            event.preventDefault();
            return true;
          }

          return false;
        }
      },
      nodeViews: {
        [type]: function nodeView (node, view, getPos, decorations) {
          // @ts-ignore
          const element = createElement(contentDOM);
          return {
            contentDOM: element,
            dom: element,
            ignoreMutation (mutation) {
              if ((mutation as MutationRecord).attributeName === 'open') {
                return true;
              }
              return false;
            },
            node,
            view,
            destroy () {
              this.contentDOM = undefined;
              this.dom = undefined;
            }
          };
        }
      }
    }
  });
}
