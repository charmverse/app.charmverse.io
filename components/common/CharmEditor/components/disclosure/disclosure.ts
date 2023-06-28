import type { RawPlugins, RawSpecs } from '@bangle.dev/core';
import { createElement } from '@bangle.dev/core';
import type { DOMOutputSpec } from '@bangle.dev/pm';
import { Plugin, PluginKey, keymap } from '@bangle.dev/pm';

import { backspaceCmd, moveDownCmd } from './commands';

export function spec() {
  return [summarySpec(), detailsSpec()];
}

function summarySpec(): RawSpecs {
  return {
    type: 'node',
    name: 'disclosureSummary',
    schema: {
      content: '(paragraph | heading)',
      group: 'block',
      parseDOM: [{ tag: 'div.summary' }],
      toDOM: (): DOMOutputSpec => {
        return ['div.summary', 0];
      }
    },
    markdown: {
      toMarkdown: (state, node) => {
        state.text(node.textContent, false);
        state.ensureNewLine();
        state.closeBlock(node);
      }
    }
  };
}

function detailsSpec(): RawSpecs {
  return {
    type: 'node',
    name: 'disclosureDetails',
    schema: {
      content: 'disclosureSummary block+',
      defining: true,
      group: 'block',
      parseDOM: [{ tag: 'div.summary-details' }],
      toDOM: (): DOMOutputSpec => {
        return ['div.summary-details', 0];
      }
    },
    markdown: {
      toMarkdown: (state, node) => {
        state.text(node.textContent, false);
        state.ensureNewLine();
        state.closeBlock(node);
      }
    }
  };
}

export function plugins(): RawPlugins {
  return () => {
    return [
      keymap({
        Backspace: backspaceCmd,
        Enter: moveDownCmd
      }),
      ContainerPlugin({ type: 'disclosureSummary', contentDOM: ['summary'] }),
      ContainerPlugin({ type: 'disclosureDetails', contentDOM: ['div', { class: 'disclosure-details' }] })
    ];
  };
}

function ContainerPlugin({ type, contentDOM }: { type: string; contentDOM: DOMOutputSpec }) {
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
        }
      },
      nodeViews: {
        [type]: function nodeView(node, view) {
          // @ts-ignore
          const element = createElement(contentDOM);
          if (type === 'disclosureSummary') {
            // Toggle on summary icon click
            element.addEventListener('click', (event) => {
              if (!(event.target instanceof Element)) {
                return;
              }

              const targetEdge = element.getBoundingClientRect().left;
              const distanceFromEdge = event.clientX - targetEdge;

              if (distanceFromEdge > 20) {
                return;
              }

              const parentContainer = element.closest('.disclosure-details');
              if (parentContainer) {
                parentContainer.toggleAttribute('open');
              }
            });
          }

          return {
            contentDOM: element,
            dom: element,
            ignoreMutation(mutation) {
              if ((mutation as MutationRecord).attributeName === 'open') {
                return true;
              }
              return false;
            },
            node,
            view,
            destroy() {
              this.contentDOM = undefined;
            }
          };
        }
      }
    }
  });
}
