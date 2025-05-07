import { trailingNode } from 'prosemirror-trailing-node';
// add a trailing node to the document so you can always add a new line

export function plugins() {
  return [
    trailingNode({
      ignoredNodes: [],
      nodeName: 'paragraph'
    })
  ];
}
