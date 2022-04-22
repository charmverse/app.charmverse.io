import { RawPlugins, RawSpecs, createElement } from '@bangle.dev/core';
import { DOMOutputSpec, Plugin, PluginKey } from '@bangle.dev/pm';

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
      ContainerPlugin({ type: 'disclosureSummary', contentDOM: ['summary'] }),
      ContainerPlugin({ type: 'disclosureDetails', contentDOM: ['details'] })
    ];
  };
}

function ContainerPlugin ({ type, contentDOM }: { type: string, contentDOM: DOMOutputSpec }) {
  return new Plugin({
    key: new PluginKey(`${type}-NodeView`),
    props: {
      nodeViews: {
        [type]: function nodeView (node, view, getPos, decorations) {
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
