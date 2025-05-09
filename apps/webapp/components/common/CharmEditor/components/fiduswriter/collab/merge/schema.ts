import type { DOMOutputSpec, Mark, Node, NodeSpec } from 'prosemirror-model';
import { Schema } from 'prosemirror-model';

export function parseDiff(str: string) {
  if (!str) {
    return [];
  }
  let tracks;
  try {
    tracks = JSON.parse(str);
  } catch (error) {
    return [];
  }
  if (!Array.isArray(tracks)) {
    return [];
  }
}

export const createDiffSchema = function (docSchema: Schema) {
  let specNodes = docSchema.spec.nodes;

  specNodes.forEach((nodeTypeName: string) => {
    const nodeType = specNodes.get(nodeTypeName) as NodeSpec;
    if (nodeType.group !== 'block') {
      return;
    }
    const attrs = nodeType.attrs;
    specNodes = specNodes.update(nodeTypeName, {
      ...nodeType,
      attrs: { diffdata: { default: [] }, ...attrs },
      toDOM(node: Node) {
        if (nodeType.toDOM) {
          let dom = nodeType.toDOM(node) as unknown as any[];
          if (node.attrs.diffdata && node.attrs.diffdata.length) {
            if (dom[1].class) {
              dom[1].class = `${dom[1].class} ${node.attrs.diffdata[0].type}`;
            } else {
              dom[1].class = node.attrs.diffdata[0].type;
            }
            dom = [dom[0], { 'data-diffdata': JSON.stringify(node.attrs.diffdata), ...dom[1] }, dom[2]];
          }
          return dom as unknown as DOMOutputSpec;
        }
        return 'span';
      },
      parseDOM: nodeType.parseDOM?.map((tag) => ({
        tag: tag.tag,
        getAttrs(dom: HTMLElement | string) {
          if (typeof dom === 'string') {
            return {};
          }
          const _attrs = tag.getAttrs?.(dom);
          return { diffdata: parseDiff(dom.dataset.diffdata || ''), ..._attrs };
        }
      }))
    });
  });

  const diffdata = {
    attrs: {
      diff: {
        default: ''
      },
      steps: {
        default: []
      },
      from: {
        default: ''
      },
      to: {
        default: ''
      },
      markOnly: {
        default: false
      }
    },
    inclusive: false,
    parseDOM: [
      {
        tag: 'span.diff',
        getAttrs(dom: HTMLElement | string) {
          if (typeof dom === 'string') {
            return {};
          }
          return {
            diff: dom.dataset.diff,
            steps: dom.dataset.steps
          };
        }
      }
    ],
    toDOM(node: Mark): DOMOutputSpec {
      return [
        'span',
        {
          class: `diff ${node.attrs.diff}`,
          'data-diff': node.attrs.diff,
          'data-steps': node.attrs.steps,
          'data-from': node.attrs.from,
          'data-to': node.attrs.to,
          'data-markOnly': node.attrs.markOnly
        }
      ];
    }
  };

  const spec = {
    nodes: specNodes,
    marks: docSchema.spec.marks.addToEnd('diffdata', diffdata)
  };

  // Update link mark toDom to render a span instead of anchor tag
  // Since editable false PM Editor treats anchor tag as a normal a tag
  // and redirects
  const linkMarkSpec = spec.marks.get('link');
  spec.marks = spec.marks.update('link', {
    ...linkMarkSpec,
    toDOM: (node: Mark) => {
      const dom = linkMarkSpec?.toDOM?.(node, true);
      if (dom instanceof Array) {
        // @ts-ignore readonly prop
        dom[0] = 'span';
      }
      return dom || 'span';
    }
  });

  return new Schema(spec);
};
